const WebSocket = require("ws");
const latestProgress = new Map();

let wss;

const clients = new Map();

const initializeWebSocket = (server) => {

    wss = new WebSocket.Server({
        server
    });

    console.log("WebSocket server started");

    wss.on("connection", (ws) => {

        console.log("WebSocket client connected");

        ws.on("message", (message) => {

            try {

                const data =
                    JSON.parse(message.toString());

                console.log(
                    "WebSocket message:",
                    data
                );

                if (
                    data.type === "subscribe" &&
                    data.importId
                ) {

                    clients.set(
                        data.importId,
                        ws
                    );

                    console.log(
                        "Subscribed to:",
                        data.importId
                    );
                }

            } catch (error) {

                console.error(
                    "WebSocket message error:",
                    error.message
                );
            }
        });


        ws.on("close", () => {

            console.log(
                "WebSocket client disconnected"
            );

            for (
                const [importId, client]
                of clients.entries()
            ) {

                if (client === ws) {
                    clients.delete(importId);
                }
            }
        });

    });
};


const sendProgress = (importId, progress) => {

    latestProgress.set(importId, progress);

    console.log("SEND PROGRESS CALLED");
    console.log("Import ID:", importId);
    console.log("Progress:", progress);
    console.log("Available clients:", [...clients.keys()]);

    const ws = clients.get(importId);

    if (!ws) {
        console.log(
            "NO WEBSOCKET CLIENT FOUND FOR:",
            importId
        );
        return;
    }

    if (ws.readyState === WebSocket.OPEN) {

        ws.send(JSON.stringify({
            type: "import-progress",
            importId,
            ...progress
        }));

        console.log("Progress sent successfully");

    } else {

        console.log(
            "WebSocket is not OPEN. State:",
            ws.readyState
        );
    }
};


module.exports = {
    initializeWebSocket,
    sendProgress
};




