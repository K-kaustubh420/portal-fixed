// app/api/login/route.ts
"use server"
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { email, password } = await request.json();

    if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 }); // Bad Request
    }

    try {
        const response = await fetch("https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({ email, password }),
          });
          
          const data = await response.json();
          console.log("Raw response:", response.status, data);
          
          if (response.ok) {
            return NextResponse.json({ message: "Login successful", user: data }, { status: 200 });
          } else {
            return NextResponse.json({ error: data.message || "Login failed", details: data }, { status: response.status || 401 });
          }
          

    } catch (error: any) {
        console.error("Error during manual login:", error);
        return NextResponse.json({ error: "Failed to connect to authentication service" }, { status: 500 }); // Internal Server Error
    }
}