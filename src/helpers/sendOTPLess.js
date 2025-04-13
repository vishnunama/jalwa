export async function sendOtpLess(phoneNo){
    try {
        const options = {
            method: 'POST',
            headers: {
                clientId: 'MEV2Z2U0T61KOOVRBZBJBQU19Y0PKH8V',
                clientSecret: 'f8v5aajez8tzo7i8otm1ntrlif6aju7r',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber: "+91"+`${phoneNo}`,
                expiry: 120,
                otpLength: 6,
                channels: ["SMS"],
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



