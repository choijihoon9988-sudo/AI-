const toastConfig = {
    duration: 3000,
    gravity: "top",
    position: "right",
    stopOnFocus: true,
};

function success(message) {
    Toastify({
       ...toastConfig,
        text: message,
        style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
    }).showToast();
}

function error(message) {
    Toastify({
       ...toastConfig,
        text: message,
        style: {
            background: "linear-gradient(to right, #ff5f6d, #ffc371)",
        },
    }).showToast();
}

export const toast = {
    success,
    error,
};