'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function ScannerLoginPage() {

  const router = useRouter();

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  // =====================================
  // LOGIN
  // =====================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    try {
      const response = await axios.post(
        `${apiUrl}/api/scanner/login`,
        {
          username: cleanUsername,
          password: cleanPassword
        }
      );

      localStorage.setItem('scanner_token', response.data.token);
      router.push(`/scanner/${response.data.event_id || 1}`);
    } catch (error) {
      console.log(error);
      alert('Invalid Credentials');
    }
  };

  return (

    <main
      className="
        min-h-screen
        bg-gradient-to-br
        from-black
        via-zinc-950
        to-violet-950
        flex
        items-center
        justify-center
        p-6
        overflow-hidden
        relative
      "
    >

      {/* BACKGROUND GLOW */}

      <div className="
        absolute
        inset-0
        overflow-hidden
      ">

        <div className="
          absolute
          top-[-200px]
          left-[-200px]
          w-[500px]
          h-[500px]
          bg-violet-500/20
          blur-[180px]
          rounded-full
          animate-pulse
        "></div>

        <div className="
          absolute
          bottom-[-200px]
          right-[-200px]
          w-[500px]
          h-[500px]
          bg-cyan-500/20
          blur-[180px]
          rounded-full
          animate-pulse
        "></div>

      </div>

      <form

        onSubmit={handleLogin}

        className="
          relative
          z-10
          w-full
          max-w-md
          bg-white/5
          border
          border-white/10
          backdrop-blur-xl
          rounded-[35px]
          p-10
          shadow-2xl
        "

      >

        {/* HEADER */}

        <div className="text-center mb-10">

          <h1
            className="
              text-5xl
              font-black
              bg-gradient-to-r
              from-cyan-300
              via-white
              to-violet-300
              bg-clip-text
              text-transparent
              mb-4
            "
          >
            Scanner Login
          </h1>

          <p
            className="
              text-gray-400
              text-lg
            "
          >
            EventFlow QR Verification Portal
          </p>

        </div>

        {/* USERNAME */}

        <input

          type="text"

          placeholder="Username"

          value={username}

          onChange={(e) =>

            setUsername(

              e.target.value

            )

          }

          required

          className="
            w-full
            p-4
            mb-5
            rounded-[20px]
            bg-white/5
            border
            border-white/10
            backdrop-blur-xl
            text-white
            placeholder-gray-400
            focus:outline-none
            focus:ring-2
            focus:ring-violet-500
          "

        />

        {/* PASSWORD */}

        <input

          type="password"

          placeholder="Password"

          value={password}

          onChange={(e) =>

            setPassword(

              e.target.value

            )

          }

          required

          className="
            w-full
            p-4
            mb-8
            rounded-[20px]
            bg-white/5
            border
            border-white/10
            backdrop-blur-xl
            text-white
            placeholder-gray-400
            focus:outline-none
            focus:ring-2
            focus:ring-violet-500
          "

        />

        {/* LOGIN BUTTON */}

        <button

          type="submit"

          className="
            w-full
            bg-violet-500
            hover:bg-violet-600
            text-white
            font-bold
            py-4
            rounded-[20px]
            text-lg
            transition-all
            shadow-lg
            shadow-violet-500/30
          "

        >

          Login

        </button>

      </form>

    </main>

  );

}