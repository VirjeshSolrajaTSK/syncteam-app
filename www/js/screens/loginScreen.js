import { setupRecaptcha, sendOTP, verifyOTPAndLogin } from '../auth/auth.js';

export function initLoginScreen(onLoginSuccess) {
    const elPhone = document.getElementById('input-phone');
    const elOtp = document.getElementById('input-otp');
    const elName = document.getElementById('input-name');
    const elEmail = document.getElementById('input-email');
    
    const btnSendOtp = document.getElementById('btn-send-otp');
    const btnVerifyOtp = document.getElementById('btn-verify-otp');
    const btnBack = document.getElementById('btn-back-phone');
    
    const stepPhone = document.getElementById('step-phone');
    const stepOtp = document.getElementById('step-otp');
    const errorMsg = document.getElementById('auth-error-message');
    const displayPhone = document.getElementById('display-phone');
    const newUserFields = document.getElementById('new-user-fields');
    
    // Always show new user fields for OTP just in case they are new
    newUserFields.style.display = 'block';

    setupRecaptcha('recaptcha-container');

    btnSendOtp.addEventListener('click', async () => {
        const phone = elPhone.value.trim();
        if (!phone) {
            showError("Please enter a valid phone number.");
            return;
        }
        
        btnSendOtp.disabled = true;
        btnSendOtp.innerText = "Sending...";
        errorMsg.innerText = "";
        
        try {
            await sendOTP(phone);
            displayPhone.innerText = phone;
            stepPhone.classList.remove('active');
            stepOtp.classList.add('active');
        } catch (err) {
            showError("Failed to send OTP. Try again.");
            console.error(err);
        } finally {
            btnSendOtp.disabled = false;
            btnSendOtp.innerText = "Continue";
        }
    });

    btnVerifyOtp.addEventListener('click', async () => {
        const code = elOtp.value.trim();
        if (!code) {
            showError("Please enter the verification code.");
            return;
        }

        btnVerifyOtp.disabled = true;
        btnVerifyOtp.innerText = "Verifying...";
        errorMsg.innerText = "";

        try {
            const user = await verifyOTPAndLogin(code, elName.value.trim(), elEmail.value.trim());
            onLoginSuccess(user);
        } catch (err) {
            showError("Invalid OTP. Try again.");
            console.error(err);
            btnVerifyOtp.disabled = false;
            btnVerifyOtp.innerText = "Verify & Login";
        }
    });

    btnBack.addEventListener('click', () => {
        stepOtp.classList.remove('active');
        stepPhone.classList.add('active');
        errorMsg.innerText = "";
        elOtp.value = "";
    });

    function showError(msg) {
        errorMsg.innerText = msg;
    }
}
