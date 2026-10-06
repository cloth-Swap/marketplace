export function registerNotifications() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications.");
    return;
  }

  if (Notification.permission === "granted") {
    console.log("Notifications already allowed.");
    return;
  }

  if (Notification.permission === "denied") {
    console.log("Notifications are blocked.");
    return;
  }

  Notification.requestPermission().then(function (permission) {
    console.log("Notification permission:", permission);

    if (permission === "granted") {
      new Notification("ClothSwap", {
        body: "Notifications are enabled successfully!",
      });
    }
  });
}