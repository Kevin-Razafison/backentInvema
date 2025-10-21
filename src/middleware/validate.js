// validate(schema) retourne un middleware qui valide req.body
export default function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map(d => d.message),
      });
    }
    req.validatedBody = value;
    next();
  };
}
