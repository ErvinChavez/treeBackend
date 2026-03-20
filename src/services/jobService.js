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

module.exports = {
    isValidStatusChange,
};