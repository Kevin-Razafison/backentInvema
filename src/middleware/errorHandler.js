// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  console.error("❌ Erreur :", err);

  const status = err.status || 500;
  const message =
    err.message || "Une erreur interne s’est produite, réessayez plus tard.";

  res.status(status).json({ error: message });
}
