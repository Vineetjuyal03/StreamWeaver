const socket =
    new WebSocket("ws://localhost:5000");

socket.onopen = () => {

    console.log(
        "WebSocket connected"
    );

    socket.send(
        JSON.stringify({
            type: "subscribe",
            importId: "YOUR_IMPORT_ID"
        })
    );
};


socket.onmessage = (event) => {

    const data =
        JSON.parse(event.data);

    console.log(
        "Import progress:",
        data
    );

};