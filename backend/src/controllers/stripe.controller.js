const Stripe = require('stripe');
const { User } = require('../models');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Constants for subscription plans
const SUBSCRIPTION_PLANS = {
  PRO: {
    id: 'pro_plan',
    name: 'Pro Plan',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  ENTERPRISE: {
    id: 'enterprise_plan',
    name: 'Enterprise Plan',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
};

// Get subscription plans
exports.getPlans = async (req, res) => {
  res.json({
    plans: [
      {
        id: 'free_plan',
        name: 'Free Plan',
        price: 0,
        features: [
          'Up to 3 websites',
          'Basic templates',
          'Landing Pad branding',
          'Community support',
        ],
        current: req.user.subscription === 'free',
      },
      {
        id: SUBSCRIPTION_PLANS.PRO.id,
        name: SUBSCRIPTION_PLANS.PRO.name,
        price: 12, // $12/month
        features: [
          'Up to 10 websites',
          'All templates',
          'Custom domain support',
          'No Landing Pad branding',
          'Priority support',
        ],
        current: req.user.subscription === 'pro',
      },
      {
        id: SUBSCRIPTION_PLANS.ENTERPRISE.id,
        name: SUBSCRIPTION_PLANS.ENTERPRISE.name,
        price: 49, // $49/month
        features: [
          'Unlimited websites',
          'All templates',
          'Custom domain support',
          'White-label option',
          'Team collaboration',
          'Dedicated support',
        ],
        current: req.user.subscription === 'enterprise',
      },
    ],
  });
};

// Create a checkout session for subscription
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { planId } = req.body;
    
    // Validate plan
    let priceId;
    let planType;
    
    if (planId === SUBSCRIPTION_PLANS.PRO.id) {
      priceId = SUBSCRIPTION_PLANS.PRO.priceId;
      planType = 'pro';
    } else if (planId === SUBSCRIPTION_PLANS.ENTERPRISE.id) {
      priceId = SUBSCRIPTION_PLANS.ENTERPRISE.priceId;
      planType = 'enterprise';
    } else {
      return res.status(400).json({ message: 'Invalid plan ID' });
    }
    
    // Get or create Stripe customer
    let customerId = req.user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: {
          userId: req.user.id,
        },
      });
      
      customerId = customer.id;
      
      // Save customer ID to user
      await User.update(
        { stripeCustomerId: customerId },
        { where: { id: req.user.id } }
      );
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription/cancel`,
      metadata: {
        userId: req.user.id,
        planType,
      },
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    next(error);
  }
};

// Handle webhook events from Stripe
exports.handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      // Update user subscription
      if (session.metadata.userId) {
        await User.update(
          {
            subscription: session.metadata.planType,
            stripeSubscriptionId: session.subscription,
          },
          { where: { id: session.metadata.userId } }
        );
      }
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      
      // Get the customer
      const customer = await stripe.customers.retrieve(subscription.customer);
      
      if (customer.metadata.userId) {
        // Check subscription status
        if (subscription.status === 'active') {
          // Get the price to determine plan type
          const priceId = subscription.items.data[0].price.id;
          
          let planType;
          if (priceId === SUBSCRIPTION_PLANS.PRO.priceId) {
            planType = 'pro';
          } else if (priceId === SUBSCRIPTION_PLANS.ENTERPRISE.priceId) {
            planType = 'enterprise';
          } else {
            planType = 'free';
          }
          
          // Update user subscription
          await User.update(
            { subscription: planType },
            { where: { id: customer.metadata.userId } }
          );
        }
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      
      // Get the customer
      const customer = await stripe.customers.retrieve(subscription.customer);
      
      if (customer.metadata.userId) {
        // Downgrade to free plan
        await User.update(
          {
            subscription: 'free',
            stripeSubscriptionId: null,
          },
          { where: { id: customer.metadata.userId } }
        );
      }
      break;
    }
  }
  
  res.json({ received: true });
};

// Get current subscription
exports.getCurrentSubscription = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user.stripeSubscriptionId) {
      return res.json({
        subscription: {
          plan: 'free',
          status: 'active',
        },
      });
    }
    
    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    res.json({
      subscription: {
        plan: user.subscription,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    next(error);
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription' });
    }
    
    // Cancel at period end
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    
    res.json({ message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    next(error);
  }
};

// Resume subscription
exports.resumeSubscription = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription' });
    }
    
    // Remove cancel at period end
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    
    res.json({ message: 'Subscription resumed successfully' });
  } catch (error) {
    console.error('Resume subscription error:', error);
    next(error);
  }
};
