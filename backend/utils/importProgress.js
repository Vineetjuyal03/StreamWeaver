const progressMap = new Map();

const LOG_INTERVAL = 50000; // print a terminal line every 50,000 rows

const startImport = (importId) => {
    progressMap.set(importId, {
        rowsProcessed: 0,
        startedAt: Date.now(),
        rowsPerSecond: 0,
        status: "processing"
    });
    console.log(`[${importId}] Import started`);
};

const updateProgress = (importId, rows) => {
    const progress = progressMap.get(importId);

    if (!progress) {
        return;
    }

    progress.rowsProcessed += rows;

    const elapsed = (Date.now() - progress.startedAt) / 1000;

    progress.rowsPerSecond =
        elapsed > 0
            ? Math.round(progress.rowsProcessed / elapsed)
            : 0;

    if (progress.rowsProcessed % LOG_INTERVAL === 0) {
        console.log(
            `[${importId}] ${progress.rowsProcessed} rows | ${progress.rowsPerSecond} rows/sec`
        );
    }
};

const completeImport = (importId) => {
    const progress = progressMap.get(importId);

    if (!progress) {
        return;
    }

    progress.status = "completed";

    const totalTime = ((Date.now() - progress.startedAt) / 1000).toFixed(1);

    console.log(
        `[${importId}] COMPLETED — ${progress.rowsProcessed} total rows in ${totalTime}s (avg ${progress.rowsPerSecond} rows/sec)`
    );
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