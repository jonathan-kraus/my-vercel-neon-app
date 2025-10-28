// components/Spinner.tsx
export default function Spinner() {
  return (
    <>
      <div className="spinner" />
      <style jsx>{`
        .spinner {
          border: 4px solid #71277aff;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 0.8s linear infinite;
          margin: auto;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
