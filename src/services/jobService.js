const Payment = require('../models/Payment');

//Allowed transitions map
const allowedTransitions = {
    pending_quote: ['quote_scheduled', 'cancelled'],
    quote_scheduled: ['scheduled', 'cancelled'],
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: ['paid'],
    paid: [],
    cancelled: [],
};

//Validate transition
const isValidStatusChange = (currentStatus, newStatus) => {
    return allowedTransitions[currentStatus]?.includes(newStatus);
};

//Payment methods admin can log by hand, plus "card" for Stripe/Clover
const PAYMENT_METHODS = ['check', 'zelle', 'venmo', 'cashapp', 'cash', 'card'];

const getJobBalance = async (job) => {
    const amountPaid = Number(
        (await Payment.sum('amount', { where: { jobId: job.id } })) || 0
    );

    const totalAmount = Number(job.totalAmount || 0);
    const balanceRemaining = Math.max(totalAmount - amountPaid, 0);

    return { amountPaid, balanceRemaining };
};

const applyBalanceToJob = async (job) => {
    const { amountPaid, balanceRemaining } = await getJobBalance(job);

    if (
        job.status === 'completed' &&
        Number(job.totalAmount) > 0 &&
        balanceRemaining <= 0
    ) {
        job.status = 'paid';
        job.paidAt = new Date();
    }

    return { amountPaid, balanceRemaining };
};

module.exports = {
    isValidStatusChange,
    PAYMENT_METHODS,
    getJobBalance,
    applyBalanceToJob,
};