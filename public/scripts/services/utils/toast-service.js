const toastConfig = {
    duration: 3000, // 3초 동안 보여줘
    gravity: "top", // 화면 위에 나와
    position: "right", // 오른쪽에 나와
    stopOnFocus: true, // 마우스를 올리면 사라지지 않아
};

/**
 * 성공 메시지 토스트를 보여줘.
 * @param {string} message - 보여줄 메시지 내용
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
 * 오류 메시지 토스트를 보여줘.
 * @param {string} message - 보여줄 메시지 내용
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

// 다른 파일에서 toast.success("메시지") 형태로 쉽게 쓸 수 있도록 내보내기
export const toast = {
    success,
    error,
};