// Hide JS warning banner, if JS is enabled to run on page.
document.getElementById('js-disabled-banner').style.display = 'none';

// Toggle between login and reset password forms
if (document.getElementById('forgot-password')) {
    document.getElementById('forgot-password').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('reset-form').style.display = 'block';
    });
}

if (document.getElementById('back-to-login')) {
    document.getElementById('back-to-login').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('reset-form').style.display = 'none';
    });
}

// Account form validation.
if (document.getElementById('account-update-button')) {
    document.getElementById('account-update-button').addEventListener('click', function(event) {
        const newPassword = document.getElementById('password').value;
        const confirmNewPassword = document.getElementById('confirm-password').value;
        const newUsername = document.getElementById('username').value;
        const confirmNewUsername = document.getElementById('confirm-username').value;
        const newEmail = document.getElementById('email').value;
        const confirmNewEmail = document.getElementById('confirm-email').value;

        if ((newPassword !== confirmNewPassword && (newPassword || confirmNewPassword)) ||
            (newUsername !== confirmNewUsername && (newUsername || confirmNewUsername)) ||
            (newEmail !== confirmNewEmail && (newEmail || confirmNewEmail))) {
            alert('Please make sure you have confirmed any changes and they match.');
            event.preventDefault();
        }
    });
}
