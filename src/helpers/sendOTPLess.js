export async function sendOtpLess(phoneNo){
    try {
        const options = {
            method: 'POST',
            headers: {
                clientId: '',
                clientSecret: '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber: "+91"+`${phoneNo}`,

                metaData: { key1: "Data1", key2: "Data2" }
            })
        };

        const response = await fetch('https://auth.otpless.app/auth/v1/initiate/otp', options);
        const data = await response.json();
        return data;

    } catch (e) {
        console.error(e);
        return { status: false, message: e.message };
    }
};



