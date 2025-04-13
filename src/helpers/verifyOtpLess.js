export async function verifyOtpLess(requestId,otp){
    try {
        const options = {
            method: 'POST',
            headers: {
                clientId: 'MEV2Z2U0T61KOOVRBZBJBQU19Y0PKH8V',
                clientSecret: 'f8v5aajez8tzo7i8otm1ntrlif6aju7r',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requestId: requestId,
                otp: otp,
            })
        };

        const response = await fetch('https://auth.otpless.app/auth/v1/verify/otp', options);
        const data = await response.json();

        console.log(data);
        return data;

    } catch (e) {
        console.error(e);
        return { status: false, message: e.message };
    }
};



