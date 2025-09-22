export const config = {
  folderName: "data",
  headers: ["inicio", "horas", "razón", "estado"],
  usersSpreadsheet: "capitanes_data",
  usersSheet: "Capitanes",
  passwordSheet: "Contraseña",
  imagesFolder: "imagenes_capitanes",
  headerFormats: {
    1: {
      numberFormat: "[h]:mm:ss",
    },
    3: {
      conditionalRules: [
        {
          type: "textIsEmpty",
          background: "white",
        },
        {
          type: "textEqualTo",
          value: "trabajando",
          background: "#41B451",
        },
        {
          type: "textEqualTo",
          value: "horas extra",
          background: "#41B451",
        },
        {
          type: "textEqualTo",
          value: "fin jornada",
          background: "#389FBE",
        },
        {
          type: "textEqualTo",
          value: "no trabajando",
          background: "#3855be",
        },
        {
          type: "notEqualTo",
          value: "trabajando",
          background: "#AA3636",
        },
      ],
    },
    2: {
      conditionalRules: [
        {
          type: "textIsEmpty",
          background: "white",
        },
        {
          type: "textEqualTo",
          value: " ",
          background: "#cccccc",
        },
      ],
    },
  },
  rowFormulas: {
    horas: "=IF(OR(ISBLANK(A1); ISBLANK(A2)); 0; A2 - A1)",
  },
  formulas: {
    "Tiempo Disponible (hrs)": {
      formula: '=SUMIF(D2:D, "trabajando", B2:B) + F13',
      color: "#a4c2f4",
      format: {
        numberFormat: "[h]:mm:ss",
      },
    },
    "Arranque de Cosecha": {
      formula: '=SUMIF(D2:D, "no trabajando", B2:B)',
      color: "#f4cccc",
      format: {
        numberFormat: "[h]:mm:ss",
      },
    },
    "Falta de Materiales": {
      formula: '=SUMIF(D2:D, "materiales", B2:B)',
      color: "#f4cccc",
      format: {
        numberFormat: "[h]:mm:ss",
      },
    },
    "Traslados Internos": {
      formula: '=SUMIF(D2:D, "traslado interno", B2:B)',
      color: "#f4cccc",
      format: {
        numberFormat: "[h]:mm:ss",
      },
    },
    "Causas Climatológicas": {
      formula: '=SUMIF(D2:D, "problemas climaticos", B2:B)',
      color: "#f4cccc",
      format: {
        numberFormat: "[h]:mm:ss",
      },
    },
    Almuerzo: {
      formula: '=SUMIF(D2:D, "almuerzo", B2:B)',
      color: "#f4cccc",
      format: {
        numberFormat: "[h]:mm:ss",
      },
    },
    "Charlas y Reuniones": {
      formula: '=SUMIF(D2:D, "charla", B2:B)',
      color: "#f4cccc",
      format: {
        numberFormat: "[h]:mm:ss",
      },
    },
    "Pausas Activas": {
      formula: '=SUMIF(D2:D, "pausa activa", B2:B)',
      color: "#f4cccc",
      format: {
        numberFormat: "[h]:mm:ss",
      },
    },
    "Cambio de Formato": {
      formula: '=SUMIF(D2:D, "Cambio de formato", B2:B)',
      color: "#f4cccc",
      format: {
        numberFormat: "[h]:mm:ss",
      },
    },

    "Falta de materia prima": {
      formula:
        '=IFERROR(ABS(TIMEVALUE("15:30:00") - INDEX(A:A, MATCH("materia prima", C:C, 0))), 0)',
      color: "#8e7cc3",
      format: {
        numberFormat: "[h]:mm:ss",
      },
    },

    "Total Paros": {
      formula: "=SUM(F4:F11)",
      color: "#F82525",
      format: {
        numberFormat: "[h]:mm:ss",
      },
    },
    "Tiempo Efectivo": {
      formula: "=F3",
      color: "#CDF7BC",
      format: {
        numberFormat: "[h]:mm:ss",
      },
    },
    "%EG": {
      formula: "= (F3 - F13) / (F3)",
      color: "#1B84E7",
      format: {
        numberFormat: "0.00%",
      },
    },
  },
  appConfig: {
    buttons: [
      { label: "Almuerzo", value: "almuerzo" },
      { label: "Falta de materiales", value: "materiales" },
      { label: "Traslados internos", value: "traslado interno" },
      { label: "Causas climatológicas", value: "problemas climaticos" },
      { label: "Charlas & Reuniones", value: "charla" },
      { label: "Pausas Activas", value: "pausa activa" },
      { label: "Cambio de formato", value: "Cambio de formato" },
    ],

    select_options: [
      { label: "Santo Domingo", value: "Santo_Domingo" },
      { label: "Agromorin", value: "Agromorin" },
      { label: "Casaverde", value: "Casaverde" },
      { label: "Compositan", value: "Compositan" },
      { label: "Victoria", value: "Victoria" },
      { label: "El Palmar", value: "El_Palmar" },
    ],
    messages: {
      almuerzo: {
        title: "¡Disfruta del almuerzo, Capitán!",
        message: `Recargar energías es la mejor inversión para una tarde productiva. ¡Te esperamos!`,
      },
      materiales: {
        title: "¡Material en camino, Capitán!",
        message: `En unos minutos tu equipo volverá a la acción con todo lo necesario.`,
      },
      charla: {
        title: "¡Un momento de estrategia, Capitán!",
        message: `Tu equipo está planificando los siguientes pasos. La comunicación es la base del éxito.`,
      },
      "Cambio de formato": {
        title: "¡Cambio de formato, Capitán!",
        message: `El equipo está ajustándose para cosechar el nuevo producto. ¡La versatilidad es nuestra fortaleza!`,
      },
      "traslado interno": {
        title: "¡En movimiento, Capitán!",
        message: `El equipo se está trasladando. ¡La productividad no se detiene!`,
      },
      "problemas climaticos": {
        title: "¡Una breve pausa, Capitán!",
        message: `El clima manda en el campo, pero el equipo está listo para continuar en cuanto el cielo lo permita.`,
      },
      "pausa activa": {
        title: `Recuerda, Capitán: ¡Cuerpo sano, mente sana!`,
        message: `El equipo está en su pausa activa. Unos minutos de estiramiento y a seguir con la jornada.`,
      },
    },
  },
};
