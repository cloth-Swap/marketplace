
import React, { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";
import API_URL, { apiFetch } from "../api.js";

const h = React.createElement;

const termsData = [
  {
    title: "1. Acceptance of Terms",
    content: [
      "By accessing or using ClothSwap, you agree to follow these Terms & Conditions and all applicable rules.",
      "If you do not agree with these terms, please do not use the platform."
    ]
  },
  {
    title: "2. User Account Responsibilities",
    content: [
      "Users must provide accurate and genuine information while creating an account.",
      "You are responsible for maintaining the confidentiality of your login credentials and for all activities performed through your account.",
      "Do not create multiple or fake accounts to misuse the platform or mislead other users.",
      "Please notify the ClothSwap team if you notice any suspicious activity involving your account."
    ]
  },
  {
    title: "3. Clothing Listing Rules",
    content: [
      "Users must upload genuine clothing items that they own or are authorized to exchange.",
      "Every listing should include an accurate title, description, category, size, condition and clear photographs.",
      "Do not upload misleading, duplicate, fake, prohibited or inappropriate listings.",
      "The description and photographs must correctly represent the actual condition of the clothing item."
    ]
  },
  {
    title: "4. Clothing Condition and Authenticity",
    content: [
      "Users must honestly disclose any damage, stains, defects or other issues with their clothing items.",
      "Do not misrepresent the brand, quality, size or condition of an item.",
      "Users should carefully review the listing details and ask questions before accepting a swap.",
      "ClothSwap encourages honest and transparent exchanges between users."
    ]
  },
  {
    title: "5. Swap Requests and Agreements",
    content: [
      "Users may send swap requests for available clothing listings.",
      "A swap should proceed only after the concerned users have reviewed and agreed to the exchange details.",
      "Users should confirm the clothing items, condition and exchange method before proceeding.",
      "Do not send repeated unwanted requests or pressure another user to accept a swap.",
      "Users should communicate any changes or cancellation as early as possible."
    ]
  },
  {
    title: "6. Swap Value Calculator",
    content: [
      "The Swap Value Calculator is provided only as a guidance tool to help users compare clothing values.",
      "The estimated value is not a guaranteed market price or a compulsory exchange value.",
      "Users are responsible for mutually agreeing on whether they are comfortable with the proposed exchange."
    ]
  },
  {
    title: "7. Communication and User Conduct",
    content: [
      "Users must communicate respectfully and honestly with other members.",
      "Harassment, abusive language, threats, bullying, discrimination and inappropriate messages are not allowed.",
      "Do not share another user's personal information without their permission.",
      "Do not use ClothSwap to spam, deceive, threaten or disturb other users."
    ]
  },
  {
    title: "8. Courier Exchange Policy",
    content: [
      "Users choosing the Courier option should mutually confirm the exchange details before dispatching items.",
      "Users should pack items carefully and share accurate courier or tracking information whenever applicable.",
      "Users are encouraged to keep valid shipment details and proof of dispatch or delivery.",
      "ClothSwap provides exchange-related coordination features but does not directly control third-party courier services.",
      "Courier delays, service availability and delivery issues may depend on the courier provider."
    ]
  },
  {
    title: "9. Local Exchange Safety",
    content: [
      "Users choosing Local Exchange should mutually agree on a suitable meeting place, date and time.",
      "For safety, users are encouraged to meet in public and well-lit places.",
      "Avoid sharing unnecessary personal or sensitive information.",
      "Users should inspect the clothing item before confirming the exchange.",
      "Both users should confirm the exchange only after they are satisfied with the agreed conditions."
    ]
  },
  {
    title: "10. Swap Cancellation and Completion",
    content: [
      "Users should inform the other participant if they are unable to continue with an agreed exchange.",
      "Do not falsely mark an item as dispatched, received or delivered.",
      "Where OTP verification is provided, users must follow the applicable verification process.",
      "A swap should be marked as completed only after the exchange has actually taken place.",
      "False completion confirmations or misuse of the exchange process may result in action against the account."
    ]
  },
  {
    title: "11. Reporting Problems and Submitting Complaints",
    content: [
      "Users can report suspicious listings, inappropriate content, fake information or misconduct through the available reporting options.",
      "If a problem occurs during a swap, users can submit a complaint or dispute to the ClothSwap team.",
      "Please provide accurate details and relevant information so that the issue can be properly reviewed.",
      "The ClothSwap team may review submitted reports and complaints and take appropriate action based on the available information.",
      "Submitting a false, misleading or intentionally harmful complaint is not permitted."
    ]
  },
  {
    title: "12. Reported Listings and Content Removal",
    content: [
      "Listings that violate these terms or contain misleading, inappropriate or prohibited content may be reviewed.",
      "ClothSwap may remove or restrict access to content that violates platform rules.",
      "Users should not upload content that infringes another person's rights or contains harmful or illegal material."
    ]
  },
  {
    title: "13. Violation of Rules and Account Actions",
    content: [
      "Every user is expected to follow ClothSwap's rules and use the platform responsibly.",
      "Actions such as fraud, fake listings, scams, harassment, misleading information, repeated misuse, abusive behaviour or violation of these terms are not allowed.",
      "If a user violates these rules, ClothSwap may take appropriate action depending on the seriousness and frequency of the violation.",
      "Possible actions may include:",
      "• Issuing a warning to the user.",
      "• Removing or restricting an inappropriate listing.",
      "• Restricting or cancelling a swap request where necessary.",
      "• Temporarily suspending the user's account.",
      "• Permanently blocking the user's account in serious or repeated cases.",
      "Serious violations may result in immediate account suspension or blocking.",
      "Repeated violations may lead to stricter action, even if previous warnings have been issued.",
      "Users whose accounts are restricted or blocked may lose access to some or all ClothSwap services."
    ]
  },
  {
    title: "14. Privacy and Personal Information",
    content: [
      "Users should provide only the information required to use ClothSwap.",
      "Personal information should not be misused, shared publicly or used to harass another member.",
      "ClothSwap handles user information according to its Privacy Policy.",
      "Users are encouraged to read the Privacy Policy to understand how their information is handled."
    ]
  },
  {
    title: "15. Platform Responsibilities and Limitations",
    content: [
      "ClothSwap provides a platform for users to discover clothing items and coordinate exchanges.",
      "ClothSwap is not the owner or seller of clothing items listed by users.",
      "Users are responsible for checking item details, condition and exchange arrangements before proceeding.",
      "ClothSwap cannot guarantee the quality, authenticity or condition of items uploaded by users.",
      "The platform may experience temporary interruptions due to maintenance, technical issues or other circumstances."
    ]
  },
  {
    title: "16. Intellectual Property",
    content: [
      "The ClothSwap name, branding, design and platform content are protected by applicable intellectual property laws.",
      "Users must not copy, reproduce, distribute or misuse platform content without proper authorization.",
      "Users must ensure that photographs and other content uploaded by them do not violate another person's intellectual property rights."
    ]
  },
  {
    title: "17. Changes to These Terms",
    content: [
      "ClothSwap may update these Terms & Conditions when required.",
      "Updated terms will be published on this page along with the revised date.",
      "Continued use of ClothSwap after changes are published means that you agree to the updated terms."
    ]
  },
  {
    title: "18. Contact and Support",
    content: [
      "If you have questions, face a problem or need to report inappropriate behaviour, please use the available Help & Support or Report a Problem options on ClothSwap.",
      "Users may contact the ClothSwap team for assistance with complaints, disputes, account-related concerns or platform issues.",
      "Please provide clear and truthful information when requesting support."
    ]
  },
  {
    title: "19. Hand-to-Hand Exchange Confirmation and Deadlines",
    content: [
      "These rules apply only to Local / Hand-to-Hand exchanges and do not apply to Courier exchanges.",
      "After both users agree to a Hand-to-Hand exchange, they are responsible for completing the exchange and confirming it on ClothSwap within the specified time.",
      "A first reminder notification will be sent after 24 hours if the required exchange confirmation is still pending.",
      "A final reminder notification will be sent after 36 hours if the confirmation remains pending.",
      "If the required confirmation is still pending after 48 hours, the user responsible for the pending confirmation may be temporarily restricted from sending new swap requests until the pending confirmation is completed.",
      "Once the required confirmation is submitted, the temporary restriction will be cleared according to the platform's system rules.",
      "If a genuine exchange problem or dispute is reported, the case may be reviewed by the ClothSwap Admin team. Users reporting genuine problems will not be unfairly restricted while the issue is under review.",
      "These deadlines apply only to Hand-to-Hand exchanges. Courier exchanges follow their separate delivery, OTP, and completion process."
    ]
  }
];

function TermsConditions() {
  const location = useLocation();
  const navigate = useNavigate();

  const requireAcceptance =
    location.state?.requireAcceptance === true;

  const returnTo =
    location.state?.returnTo || "/dashboard";

  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  async function handleAcceptTerms() {
    if (accepting) return;

    try {
      setAccepting(true);
      setError("");

     const response = await apiFetch(
  `${API_URL}/api/auth/accept-terms`,
  {
    method: "POST"
  }
);

      const data = await response.json();
      console.log("ACCEPT TERMS RESPONSE:", data);
console.log("RETURN TO:", returnTo);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to accept Terms & Conditions."
        );
      }

if (
  localStorage.getItem("clothswapIsAdmin") === "true"
) {
  navigate(returnTo, { replace: true });
} else {
  try {
    const response = await apiFetch(
      `${API_URL}/api/user/profile`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error("Profile check failed");
    }

    if (data.profile && data.profile.profileCompleted) {
      navigate(returnTo, { replace: true });
    } else {
      navigate("/create-profile", { replace: true });
    }
  } catch (error) {
    console.log("Profile check error:", error);
    navigate("/create-profile", { replace: true });
  }
}
    } catch (error) {
      console.error("Accept Terms Error:", error);
      setError(error.message || "Something went wrong.");
    } finally {
      setAccepting(false);
    }
  }

  return h(
    "div",
    { className: "terms-page" },

    h(
      "style",
      null,
      `
        .terms-page {
          min-height: 100vh;
          padding: 35px 16px 55px;
          background: linear-gradient(135deg, #fff0f7, #f0eaff, #fceeff);
          font-family: Arial, sans-serif;
        }

        .terms-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 32px;
          border-radius: 24px;
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow: 0 10px 35px rgba(130, 90, 150, 0.12);
          backdrop-filter: blur(12px);
        }

        .terms-back {
          display: inline-block;
          margin-bottom: 22px;
          padding: 10px 18px;
          border-radius: 25px;
          background: #f5e7ff;
          color: #75469b;
          text-decoration: none;
          font-weight: 600;
          transition: 0.25s ease;
        }

        .terms-back:hover {
          background: #ead4ff;
          color: #583078;
          transform: translateX(-4px);
        }

        .terms-heading {
          text-align: center;
          color: #75469b;
          font-size: 34px;
          font-weight: 750;
          margin: 8px 0 10px;
        }

        .terms-updated {
          text-align: center;
          color: #888;
          font-size: 14px;
          margin-bottom: 28px;
        }

        .terms-intro {
          color: #5f5269;
          line-height: 1.8;
          font-size: 15px;
          margin-bottom: 24px;
          text-align: center;
        }

        .terms-section {
          padding: 20px 22px;
          margin-bottom: 17px;
          border-radius: 17px;
          background: rgba(255,255,255,0.82);
          border: 1px solid #f0e3f8;
          box-shadow: 0 4px 14px rgba(130, 90, 150, 0.06);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .terms-section:hover {
          transform: translateY(-3px);
          box-shadow: 0 9px 22px rgba(130, 90, 150, 0.13);
        }

        .terms-section h3 {
          color: #8654a7;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 12px;
        }

        .terms-section p {
          color: #62596a;
          font-size: 14px;
          line-height: 1.8;
          margin: 7px 0;
        }

        .terms-footer {
          text-align: center;
          color: #897b91;
          font-size: 13px;
          margin-top: 28px;
        }

        .terms-accept-area {
          text-align: center;
          margin-top: 30px;
          padding-top: 25px;
          border-top: 1px solid #eadcf3;
        }

        .terms-accept-btn {
          border: none;
          border-radius: 30px;
          padding: 14px 35px;
          background: linear-gradient(135deg, #e85d9e, #a85bc7);
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 5px 16px rgba(168, 91, 199, 0.22);
        }

        .terms-accept-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .terms-error {
          color: #c62828;
          font-size: 14px;
          margin-bottom: 12px;
        }

        @media (max-width: 600px) {
          .terms-page {
            padding: 18px 10px 35px;
          }

          .terms-container {
            padding: 20px 14px;
            border-radius: 18px;
          }

          .terms-heading {
            font-size: 27px;
          }

          .terms-section {
            padding: 17px 15px;
          }

          .terms-section h3 {
            font-size: 16px;
          }

          .terms-section p {
            font-size: 13px;
          }

          .terms-accept-btn {
            width: 100%;
            padding: 14px 20px;
          }
        }
      `
    ),

    h(
      "div",
      { className: "terms-container" },

      !requireAcceptance &&
        h(
          Link,
          {
            to: "/settings",
            className: "terms-back"
          },
          "← Back to Settings"
        ),

      h(
        "h1",
        { className: "terms-heading" },
        "Terms & Conditions"
      ),

      h(
        "p",
        { className: "terms-updated" },
        "Last updated: November 2026"
      ),

      h(
        "p",
        { className: "terms-intro" },
        "Welcome to ClothSwap! These Terms & Conditions explain the rules and responsibilities for using our clothing exchange platform. Please read them carefully before using our services."
      ),

      termsData.map(function (section, index) {
        return h(
          "section",
          {
            className: "terms-section",
            key: index
          },

          h("h3", null, section.title),

          section.content.map(function (paragraph, paragraphIndex) {
            return h(
              "p",
              { key: paragraphIndex },
              paragraph
            );
          })
        );
      }),

      h(
        "p",
        { className: "terms-footer" },
        "Thank you for being a responsible member of the ClothSwap community. 💜"
      ),

      requireAcceptance &&
        h(
          "div",
          {
            className: "terms-accept-area"
          },

          error &&
            h(
              "p",
              {
                className: "terms-error"
              },
              error
            ),

          h(
            "button",
            {
              type: "button",
              className: "terms-accept-btn",
              onClick: handleAcceptTerms,
              disabled: accepting
            },
            accepting
              ? "Accepting..."
              : "I Agree & Accept Terms"
          )
        )
    )
  );
}

export default TermsConditions;
