const toastConfig = {
    duration: 3000,
    gravity: "top", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
};

/**
 * 성공 메시지 토스트를 표시합니다.
 * @param {string} message - 표시할 메시지
 */
function success(message) {
    Toastify({
       ...toastConfig,
        text: message,
        style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
    }).showToast();
}

/**
 * 오류 메시지 토스트를 표시합니다.
 * @param {string} message - 표시할 메시지
 */
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
