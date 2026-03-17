// Test script to check backend API accessibility
const API_BASE_URL = "https://mln111-1.onrender.com/api";

export const testBackendConnection = async () => {
  console.log("🔍 Testing backend connection...");

  const tests = [
    {
      name: "Root endpoint",
      url: API_BASE_URL.replace("/api", ""),
      method: "GET",
    },
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const startTime = Date.now();

      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        console.log(`✅ ${test.name}: OK (${responseTime}ms)`);
        try {
          const data = await response.json();
          console.log(`   Response:`, data);
        } catch {
          const data = await response.text();
          console.log(`   Response: ${data.substring(0, 100)}...`);
        }
      } else {
        console.log(
          `❌ ${test.name}: ${response.status} ${response.statusText}`
        );
      }
    } catch (error: any) {
      console.log(`❌ ${test.name}: ${error.message}`);

      if (error.code === "ECONNABORTED") {
        console.log("   ⏰ Timeout - server might be waking up");
      } else if (error.message.includes("Failed to fetch")) {
        console.log("   🌐 Network error - check internet connection");
      }
    }
  }
};

// Test login endpoint specifically
export const testLoginEndpoint = async () => {
  console.log("🔍 Testing login endpoint...");

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login: "test@example.com",
        password: "testpassword",
      }),
      signal: AbortSignal.timeout(15000), // 15 second timeout for login
    });

    if (response.ok) {
      console.log("✅ Login endpoint: OK");
      const data = await response.json();
      console.log("   Response:", data);
    } else {
      const errorData = await response.json();
      console.log(
        `❌ Login endpoint: ${response.status} - ${errorData.message || "Unknown error"
        }`
      );
      // Đây là lỗi bình thường vì test với tài khoản không tồn tại
      if (errorData.message?.includes("không tồn tại")) {
        console.log("   ℹ️ Expected error - test account doesn't exist");
      }
    }
  } catch (error: any) {
    console.log(`❌ Login endpoint: ${error.message}`);
  }
};

// Auto-run tests when imported - DISABLED
// if (typeof window !== "undefined") {
//   // Only run in browser
//   setTimeout(() => {
//     testBackendConnection();
//     setTimeout(() => {
//       testLoginEndpoint();
//     }, 2000);
//   }, 1000);
// }
