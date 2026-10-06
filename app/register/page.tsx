'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function RegisterPage() {

  // ====================================
  // STATES
  // ====================================

  const [formData, setFormData] = useState({

    full_name: '',
    email: '',
    phone_number: '',
    ticket_type: 'solo',
    emergency_contact_name: '',
    emergency_contact: '',
    blood_group: ''

  });

  const [paymentProof, setPaymentProof] =
    useState<File | null>(null);

  const [submitted, setSubmitted] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [emailError, setEmailError] =
    useState('');

  const [totalAmount, setTotalAmount] =
    useState(299);

  const [allowedEntries, setAllowedEntries] =
    useState(1);

  // ====================================
  // TICKET PRICE LOGIC
  // ====================================

  useEffect(() => {

    if (formData.ticket_type === 'solo') {

      setTotalAmount(299);

      setAllowedEntries(1);

    }

    if (formData.ticket_type === 'couple') {

      setTotalAmount(499);

      setAllowedEntries(2);

    }

    if (formData.ticket_type === 'group') {

      setTotalAmount(899);

      setAllowedEntries(4);

    }

  }, [formData.ticket_type]);

  // ====================================
  // HANDLE INPUT CHANGE
  // ====================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value

    });

  };

  // ====================================
  // HANDLE SUBMIT
  // ====================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    // PREVENT MULTIPLE CLICKS

    if (loading) return;

    // ====================================
    // EMAIL VALIDATION
    // ====================================

    const emailRegex =

      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) {

      setEmailError(
        'Please enter a valid email address'
      );

      return;

    }

    setEmailError('');

    setLoading(true);

    try {

      const data = new FormData();

      data.append(
        'full_name',
        formData.full_name
      );

      data.append(
        'email',
        formData.email
      );

      data.append(
        'phone_number',
        formData.phone_number
      );

      data.append(
        'ticket_type',
        formData.ticket_type
      );

      data.append(
        'emergency_contact_name',
        formData.emergency_contact_name
      );

      data.append(
        'emergency_contact',
        formData.emergency_contact
      );

      data.append(
        'blood_group',
        formData.blood_group
      );

      if (paymentProof) {

        data.append(
          'payment_proof',
          paymentProof
        );

      }

      const response = await axios.post(

        `${process.env.NEXT_PUBLIC_API_URL}/api/register`,

        data,

        {

          headers: {

            'Content-Type':
              'multipart/form-data'

          }

        }

      );

      console.log(response.data);

      setSubmitted(true);

      // CLEAR FORM

      setFormData({

        full_name: '',
        email: '',
        phone_number: '',
        ticket_type: 'solo',
        emergency_contact_name: '',
        emergency_contact: '',
        blood_group: ''

      });

      setPaymentProof(null);

      alert(
        'Registration Submitted Successfully'
      );

    } catch (error) {

      console.log(error);

      alert('Registration Failed');

    } finally {

      setLoading(false);

    }

  };

  // ====================================
  // MAIN RETURN
  // ====================================

  return (

    <div className="
      min-h-screen
      bg-black
      flex
      items-center
      justify-center
      px-5
      py-10
    ">

      <div className="
        w-full
        max-w-2xl
      ">

        {/* FORM */}

        <form

          onSubmit={handleSubmit}

          className="
            bg-black
            border
            border-yellow-700
            rounded-3xl
            p-10
          "

        >

          {/* HEADING */}

          <div className="text-center mb-10">

            <h1 className="
              text-5xl
              font-bold
              text-yellow-300
              mb-3
            ">
              Musical Jam
            </h1>

            <p className="
              text-gray-300
              text-lg
            ">
              Music • Lights • Memories
            </p>

          </div>

          {/* FULL NAME */}

          <input

            type="text"

            name="full_name"

            placeholder="Full Name"

            value={formData.full_name}

            onChange={handleChange}

            required

            className="
              w-full
              p-4
              mb-5
              rounded-xl
              bg-black
              border
              border-gray-700
              text-white
              placeholder-gray-400
              focus:outline-none
              focus:ring-2
              focus:ring-yellow-400
            "

          />

          {/* EMAIL */}

          <input

            type="email"

            name="email"

            placeholder="Email Address"

            value={formData.email}

            onChange={handleChange}

            required

            className="
              w-full
              p-4
              mb-2
              rounded-xl
              bg-black
              border
              border-gray-700
              text-white
              placeholder-gray-400
              focus:outline-none
              focus:ring-2
              focus:ring-yellow-400
            "

          />

          {/* EMAIL ERROR */}

          {

            emailError && (

              <p className="
                text-red-400
                text-sm
                mb-4
              ">

                {emailError}

              </p>

            )

          }

          {/* PHONE */}

          <input

            type="text"

            name="phone_number"

            placeholder="Phone Number"

            value={formData.phone_number}

            onChange={handleChange}

            required

            className="
              w-full
              p-4
              mb-5
              rounded-xl
              bg-black
              border
              border-gray-700
              text-white
              placeholder-gray-400
              focus:outline-none
              focus:ring-2
              focus:ring-yellow-400
            "

          />



          {/* TICKET TYPE */}

          <select

            name="ticket_type"

            value={formData.ticket_type}

            onChange={handleChange}

            className="
              w-full
              p-4
              mb-8
              rounded-xl
              bg-black
              border
              border-gray-700
              text-white
              focus:outline-none
              focus:ring-2
              focus:ring-yellow-400
            "

          >

            <option value="solo">
              Solo Pass — ₹299
            </option>

            <option value="couple">
              Couple Pass — ₹499
            </option>

            <option value="group">
              Group Pass (4 Entries) — ₹899
            </option>

          </select>

          {/* BILL SUMMARY */}

          <div className="
            bg-yellow-400/10
            border
            border-yellow-500
            rounded-2xl
            p-6
            mb-8
          ">

            <h2 className="
              text-2xl
              text-yellow-300
              font-bold
              mb-4
            ">
              Booking Summary
            </h2>

            <div className="
              text-white
              space-y-3
              text-lg
            ">

              <p>

                Ticket Type:

                <span className="
                  text-yellow-300
                  font-bold
                ">
                  {' '}
                  {formData.ticket_type}
                </span>

              </p>

              <p>

                Allowed Entries:

                <span className="
                  text-yellow-300
                  font-bold
                ">
                  {' '}
                  {allowedEntries}
                </span>

              </p>

              <p>

                Total Amount:

                <span className="
                  text-yellow-300
                  font-bold
                  text-2xl
                ">
                  {' '}
                  ₹{totalAmount}
                </span>

              </p>

            </div>

          </div>

          {/* PAYMENT QR */}

          <div className="
            text-center
            mb-8
          ">

            <h2 className="
              text-2xl
              text-yellow-300
              font-bold
              mb-4
            ">
              Scan & Pay
            </h2>

            <img

              src={

                formData.ticket_type === 'solo'

                  ? '/solo.png'

                  : formData.ticket_type === 'couple'

                  ? '/couple.png'

                  : '/group.png'

              }

              alt="Payment QR"

              className="
                w-72
                mx-auto
                rounded-2xl
                border
                border-yellow-500
              "

            />

            <p className="
              text-gray-300
              mt-4
            ">
              Pay ₹{totalAmount} and upload screenshot below
            </p>

          </div>

          {/* PAYMENT SCREENSHOT */}

          <input

            type="file"

            accept="image/*"

            required

            onChange={(e) => {

              const file =
                e.target.files?.[0];

              if (file) {

                setPaymentProof(file);

              }

            }}

            className="
              w-full
              p-4
              mb-8
              rounded-xl
              bg-black
              border
              border-gray-700
              text-white
            "

          />

          {/* SUBMIT BUTTON */}

          <button

            type="submit"

            disabled={loading}

            className="
              w-full
              bg-yellow-400
              hover:bg-yellow-300
              disabled:bg-gray-500
              disabled:cursor-not-allowed
              text-black
              font-bold
              py-4
              px-6
              rounded-2xl
              text-lg
              transition
              shadow-lg
              shadow-yellow-500/30
            "

          >

            {

              loading

                ? 'Submitting...'

                : 'Reserve Seat'

            }

          </button>

        </form>

        {/* SUCCESS MESSAGE */}

        {

          submitted && (

            <div className="
              mt-10
              bg-black
              border
              border-yellow-700
              rounded-3xl
              p-10
              text-center
            ">

              <h2 className="
                text-3xl
                text-yellow-300
                font-bold
                mb-5
              ">
                Payment Submitted Successfully 🎵
              </h2>

              <p className="
                text-white
                text-lg
              ">
                Your registration is under admin verification.
              </p>

              <p className="
                text-gray-400
                mt-4
              ">
                QR event pass will be sent to your email after approval.
              </p>

            </div>

          )

        }

      </div>

    </div>

  );

}