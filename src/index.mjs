import explicitRenderHtml from "./explicit.html";
import implicitRenderHtml from "./implicit.html";
import implicitTestRenderHtml from "./implicit-test.html";

// This is the demo secret key. In prod, we recommend you store
// your secret key(s) safely.
const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA"; // https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const SECRET_KEY = "ABCD;";

async function handlePost(request, secretKey) {
  const body = await request.formData();
  // Turnstile injects a token in "cf-turnstile-response".
  const token = body.get("cf-turnstile-response");
  const ip = request.headers.get("CF-Connecting-IP");

  console.log(body)

  // Validate the token by calling the "/siteverify" API.
  let formData = new FormData();
  formData.append("secret", secretKey);
  formData.append("response", token);
  formData.append("remoteip", ip);

  console.log(formData)

  const result = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      body: formData,
      method: "POST",
    }
  );

  const outcome = await result.json();
  if (!outcome.success) {
    return new Response(
      "The provided Turnstile token was not valid! \n" +
        JSON.stringify(outcome, null, 2)
    );
  }
  // The Turnstile token was successfully validated. Proceed with your application logic.
  // Validate login, redirect user, etc.
  // For this demo, we just echo the "/siteverify" response:
  return new Response(
    "Turnstile token successfully validated. \n" +
      JSON.stringify(outcome, null, 2)
  );
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let body;

    if (request.method === "POST" && url.pathname === "/handler") {
      // Determine the secret key based on the referring URL
      const referer = request.headers.get("Referer");
      let secretKey = SECRET_KEY;

      if (referer && referer.includes("/implicit-test")) {
        secretKey = TEST_SECRET_KEY;
      }

      return await handlePost(request, secretKey);
    }

    if (url.pathname === "/explicit") {
      body = explicitRenderHtml;
    } else if (url.pathname === "/implicit-test") {
      body = implicitTestRenderHtml;
    } else {
      body = implicitRenderHtml;
    }

    return new Response(body, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
};
