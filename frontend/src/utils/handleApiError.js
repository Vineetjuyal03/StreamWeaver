export const handleApiError = (err) => {
    // Case 1: server responded with an error status (4xx/5xx) —
    // your backend's errorHandler / handlePipelineError already
    // sent a clean { success: false, message } body
    if (err.response) {
        return {
            message: err.response.data?.message || 'Something went wrong on the server.',
            status: err.response.status,
            type: 'server',
        };
    }

    // Case 2: request was sent but no response ever came back —
    // server unreachable, connection dropped mid-request, etc.
    if (err.request) {
        return {
            message: 'Could not reach the server. Check your connection and try again.',
            status: null,
            type: 'network',
        };
    }

    // Case 3: something failed before the request was even sent
    // (e.g. a bug in how the request was built)
    return {
        message: err.message || 'An unexpected error occurred.',
        status: null,
        type: 'client',
    };
};