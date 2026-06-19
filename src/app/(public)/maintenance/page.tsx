"use client";

import { ArrowLeft, Construction, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen overflow-hidden font-sans"
      style={{ background: "#0A0F1E" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

        .font-display {
          font-family: 'Sora', sans-serif;
        }

        .font-body {
          font-family: 'Inter', sans-serif;
        }

        .dot-grid {
          background-image: radial-gradient(
            circle at 1.5px 1.5px,
            #A3E635 1.5px,
            transparent 0
          );
          background-size: 36px 36px;
          opacity: 0.05;
        }

        @keyframes fadeUp {
          from {
            opacity:0;
            transform:translateY(30px);
          }
          to {
            opacity:1;
            transform:translateY(0);
          }
        }

        @keyframes pulse {
          0%,100% {
            opacity:.4;
          }
          50% {
            opacity:.8;
          }
        }

        .fade-up {
          animation: fadeUp .8s ease both;
        }

        .fade-up-delay {
          animation: fadeUp .8s ease .15s both;
        }

        .glow {
          animation:pulse 3s infinite;
        }


        .maintenance-card {
          background:#141C36;
          border:1px solid rgba(136,153,187,.12);
          border-radius:20px;
          transition:.3s ease;
        }

        .maintenance-card:hover {
          border-color:rgba(34,197,94,.35);
          box-shadow:
          0 20px 60px -10px rgba(34,197,94,.15);
        }


        .green-btn {
          background:linear-gradient(
            135deg,
            #22C55E,
            #16A34A
          );

          color:#0A0F1E;
          transition:.3s ease;
        }

        .green-btn:hover {
          transform:translateY(-2px);
          box-shadow:
          0 10px 35px rgba(34,197,94,.35);
        }

      `}</style>


      {/* Background */}
      <div className="absolute inset-0 dot-grid" />


      {/* Ambient glow */}
      <div
        className="
        absolute
        top-0
        right-0
        w-[600px]
        h-[400px]
        rounded-full
        glow
        pointer-events-none
        "
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,.08), transparent 65%)",
        }}
      />


      <main
        className="
        relative
        min-h-screen
        flex
        items-center
        justify-center
        px-6
        "
      >

        <div
          className="
          max-w-xl
          text-center
          "
        >

          <div
            className="
            maintenance-card
            p-10
            sm:p-14
            fade-up
            "
          >

            {/* Icon */}
            <div
              className="
              mx-auto
              mb-8
              w-16
              h-16
              rounded-2xl
              flex
              items-center
              justify-center
              "
              style={{
                background:"rgba(34,197,94,.10)",
                border:
                "1px solid rgba(34,197,94,.25)"
              }}
            >

              <Construction
                className="h-8 w-8"
                style={{
                  color:"#22C55E"
                }}
              />

            </div>



            <span
              className="
              inline-block
              mb-5
              px-4
              py-2
              rounded-full
              text-xs
              font-semibold
              uppercase
              tracking-widest
              "
              style={{
                color:"#A3E635",
                background:"rgba(163,230,53,.08)",
                border:
                "1px solid rgba(163,230,53,.20)"
              }}
            >
              Under Development
            </span>



            <h1
              className="
              font-display
              text-4xl
              sm:text-5xl
              font-bold
              leading-tight
              mb-6
              "
              style={{
                color:"#F5F5F0"
              }}
            >

              Something
              <br />

              <span
                style={{
                  color:"#22C55E"
                }}
              >
                Great Is Building
              </span>

            </h1>



            <p
              className="
              font-body
              text-base
              leading-relaxed
              mb-8
              "
              style={{
                color:"rgba(136,153,187,.75)"
              }}
            >

              This section is currently being designed and developed.
              We are building a better experience and will make it
              available soon.

            </p>



            <div
              className="
              flex
              items-center
              justify-center
              gap-3
              mb-10
              "
            >

              <Sparkles
                className="h-5 w-5"
                style={{
                  color:"#A3E635"
                }}
              />

              <span
                className="
                font-body
                text-sm
                "
                style={{
                  color:"rgba(136,153,187,.55)"
                }}
              >

                Innovation takes time.

              </span>

            </div>



            <button
              onClick={() => router.back()}
              className="
              green-btn
              inline-flex
              items-center
              gap-2
              rounded-xl
              px-8
              py-4
              font-display
              font-semibold
              "
            >

              <ArrowLeft className="h-5 w-5"/>

              Go Back

            </button>


          </div>


        </div>


      </main>

    </div>
  );
}