import explicitRenderHtml from "./explicit.html";
import implicitRenderHtml from "./implicit.html";
import implicitTestRenderHtml from "./implicit-test.html";

// This is the demo secret key for testing purposes
const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, CF-Turnstile-Response',
};

function handleOptions() {
  return new Response(null, {
    headers: corsHeaders,
  });
}

async function handlePost(request, secretKey) {
  const body = await request.formData();

  // Get the form values
  const username = body.get("username");
  const password = body.get("password");
  console.log("Form Data:", { username, password });
  // Add username and password to headers
  const headers = new Headers();
  headers.append("username", username);
  headers.append("password", password);

  // Turnstile injects a token in "cf-turnstile-response".
  const token = body.get("cf-turnstile-response");
  const ip = request.headers.get("CF-Connecting-IP");

  console.log(body);

  // Validate the token by calling the "/siteverify" API.
  let formData = new FormData();
  formData.append("secret", secretKey);
  formData.append("response", token);
  formData.append("remoteip", ip);
  console.log(formData);

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
      JSON.stringify(outcome, null, 2),
    {
      status: 200,
      headers: { ...headers, ...corsHeaders }, // Add CORS headers
    }
  );
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    const url = new URL(request.url);
    let body;

    if (request.method === "POST" && url.pathname === "/handler") {
      
      // Determine the secret key based on the referring URL
      const referer = request.headers.get("Referer");
      let secretKey = env.SECRET_KEY;
      // console.log("secretKey", secretKey);

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

    // Add CORS headers to all responses
    return new Response(body, {
      headers: {
        "Content-Type": "text/html",
        ...corsHeaders
      },
    });
  },
};
