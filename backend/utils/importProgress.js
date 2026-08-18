const progressMap = new Map();

const startImport = (importId) => {
    progressMap.set(importId, {
        rowsProcessed: 0,
        startedAt: Date.now(),
        rowsPerSecond: 0,
        status: "processing"
    });
};

const updateProgress = (importId, rows) => {

    const progress = progressMap.get(importId);

    if (!progress) {
        return;
    }

    progress.rowsProcessed += rows;

    const elapsed =
        (Date.now() - progress.startedAt) / 1000;

    progress.rowsPerSecond =
        elapsed > 0
            ? Math.round(
                progress.rowsProcessed / elapsed
            )
            : 0;
};

const completeImport = (importId) => {

    const progress = progressMap.get(importId);

    if (!progress) {
        return;
    }

    progress.status = "completed";
};

const getProgress = (importId) => {
    return progressMap.get(importId);
};

module.exports = {
    startImport,
    updateProgress,
    completeImport,
    getProgress
};