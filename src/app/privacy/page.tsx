export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">Política de privacidad</h1>
      <p className="mt-4 text-muted-foreground">
        English Odyssey trata datos personales conforme al Reglamento General de Protección
        de Datos (RGPD). Los datos de alumnos y tutores son utilizados exclusivamente
        para la gestión académica y administrativa por parte de la profesora responsable.
      </p>
      <h2 className="mt-6 text-lg font-semibold">Datos recogidos</h2>
      <ul className="mt-2 list-disc pl-6">
        <li>Identificación: nombre, apellidos, fecha de nacimiento.</li>
        <li>Contacto: email, teléfono.</li>
        <li>Datos académicos: nivel, grupo, resultados de fichas, asistencia.</li>
        <li>Datos económicos: pagos y conceptos.</li>
        <li>Consentimientos firmados.</li>
      </ul>
      <h2 className="mt-6 text-lg font-semibold">Derechos</h2>
      <p className="mt-2">
        Puede ejercer en cualquier momento sus derechos de acceso, rectificación,
        supresión, oposición, limitación y portabilidad escribiendo a la profesora
        responsable. Los menores requieren consentimiento del tutor legal.
      </p>
      <h2 className="mt-6 text-lg font-semibold">Conservación</h2>
      <p className="mt-2">
        Los datos se conservan mientras dure la relación académica y durante los plazos
        exigidos por la normativa fiscal y de protección de datos.
      </p>
    </div>
  );
}
