export default function ProgressBar({ progress }) {
    if (!progress) return null;

    const { rowsProcessed, rowsPerSecond, status } = progress;

    if (status === 'connection-lost') {
        return (
            <div className="progress-container">
                <div className="progress-info error">
                    <span>⚠️ Lost connection to the server</span>
                    <span>{rowsProcessed?.toLocaleString() ?? 0} rows were processed before the drop</span>
                </div>
            </div>
        );
    }

    return (
        <div className="progress-container">
            <div className="progress-info">
                <span>{status === 'completed' ? 'Completed' : 'Processing...'}</span>
                <span>{rowsProcessed.toLocaleString()} rows · {rowsPerSecond.toLocaleString()} rows/sec</span>
            </div>
            <div className="progress-track">
                <div
                    className={`progress-fill ${status === 'completed' ? 'complete' : ''}`}
                    style={{ width: status === 'completed' ? '100%' : undefined }}
                />
            </div>
        </div>
    );
}