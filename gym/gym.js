/* =====================================================================
   Gimnasia para todos · guía interactiva
   - 42 ejercicios de «La Reforma Pro-Salud», Tomo I, con personas en 3D
   - Filtros por zona, posición y nivel; sesión guiada con temporizador
   - Mi semana y cartel de invitación
   ===================================================================== */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
  };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     EJERCICIOS · «La Reforma Pro-Salud», Tomo I, ejercicios 1–42
     Textos redactados con nuestras palabras; sin promesas de salud.
     Los movimientos de cada figura están en movimientos.js
     ------------------------------------------------------------------ */
  const EJ = [
    { id: "e1", t: "Brazos arriba por delante", zona: "Respiración y tórax", cat: "resp", pos: "pie", nivel: "suave", dosis: "10–15 veces",
      como: "De pie y erguido, con los brazos pegados al cuerpo. Súbelos por delante hasta que queden verticales y bájalos por los lados hasta la posición de partida.",
      resp: "Toma aire al subir los brazos y suéltalo al bajarlos.", trabaja: "Respiración, hombros y pecho." },
    { id: "e2", t: "Giro de cintura con bastón", zona: "Cintura", cat: "cintura", pos: "pie", nivel: "suave", mat: "Bastón o cuerda", dosis: "10 por lado",
      como: "Erguido, con los brazos estirados al frente sujetando un bastón para mantenerlos paralelos. Gira el tronco a un lado y al otro sin mover caderas ni piernas: solo se mueve de la cintura hacia arriba.",
      resp: "Toma aire al girar hacia un lado y suéltalo hacia el otro.", trabaja: "Músculos de la cintura y del tronco." },
    { id: "e3", t: "Flexión de piernas de puntillas", zona: "Espalda y piernas", cat: "piernas", pos: "pie", nivel: "medio", dosis: "5–10 veces",
      como: "De pie con las piernas juntas y las puntas de los pies un poco abiertas. Lleva las manos a la nuca y flexiona las piernas quedándote de puntillas. Vuelve a subir.",
      resp: "Toma aire al bajar y suéltalo al subir.", trabaja: "Piernas, muslos, espalda y brazos.", prec: "Ten una silla cerca por si pierdes el equilibrio. Baja solo hasta donde controles el movimiento." },
    { id: "e4", t: "Rodilla al pecho tumbado", zona: "Piernas y abdomen", cat: "abd", pos: "suelo", nivel: "suave", dosis: "10–15 veces",
      como: "Tumbado boca arriba, dobla una pierna y lleva la rodilla hacia el pecho ayudándote con las manos. Vuelve a estirarla y repite con la otra pierna.",
      resp: "Toma aire al subir la rodilla y suéltalo al estirar la pierna.", trabaja: "Piernas, muslos y abdomen." },
    { id: "e5", t: "Patada a la mano contraria", zona: "Piernas y caderas", cat: "piernas", pos: "pie", nivel: "medio", dosis: "5–10 por pierna",
      como: "Erguido, con los brazos al frente. Sube una pierna estirada intentando tocar con la punta del pie la mano contraria: pie derecho con mano izquierda y pie izquierdo con mano derecha. Alterna.",
      resp: "Toma aire al subir la pierna y suéltalo al bajarla.", trabaja: "Piernas, caderas y equilibrio.", prec: "Sube la pierna solo hasta donde llegues sin forzar. Si te desequilibras, hazlo junto a una pared." },
    { id: "e6", t: "Talones arriba sobre un libro", zona: "Pies", cat: "piernas", pos: "pie", nivel: "suave", mat: "Un libro grueso", dosis: "10–15 veces",
      como: "Apoya la parte delantera de los pies en el borde de un libro grueso, con los talones en el aire. Sube de puntillas todo lo que puedas y baja los talones por debajo del borde. Complemento: camina de puntillas, camina sobre los talones y corre en el sitio de puntillas.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Pies, pantorrillas y equilibrio." },
    { id: "e7", t: "Codos atrás para abrir el pecho", zona: "Respiración y tórax", cat: "resp", pos: "pie", nivel: "suave", dosis: "10–15 veces",
      como: "Erguido, con los brazos doblados a la altura de los hombros y las manos delante del pecho. Estira los brazos con energía hacia atrás para abrir el pecho y vuelve a doblarlos.",
      resp: "Toma aire al abrir los brazos y suéltalo al doblarlos.", trabaja: "Pecho, hombros y respiración." },
    { id: "e8", t: "Bicicleta con las piernas arriba", zona: "Cintura y piernas", cat: "abd", pos: "suelo", nivel: "exigente", dosis: "15–20 vueltas",
      como: "Tumbado boca arriba, sube las piernas hasta la vertical sosteniendo la espalda con las manos y los codos en el suelo. Mueve las piernas como si pedalearas.",
      resp: "Respira con normalidad, sin aguantar el aire.", trabaja: "Piernas y abdomen.", prec: "El peso va sobre los hombros, nunca sobre el cuello. Evítalo si tienes problemas de cuello, espalda o tensión alta." },
    { id: "e9", t: "Inclinación lateral con bastón", zona: "Cintura", cat: "cintura", pos: "pie", nivel: "suave", mat: "Bastón o cuerda", dosis: "10–15 veces",
      como: "Erguido, con los brazos arriba algo separados sujetando un bastón. Inclínate a la derecha y a la izquierda sin mover caderas ni piernas.",
      resp: "Toma aire hacia un lado y suéltalo hacia el otro.", trabaja: "Músculos laterales de la cintura." },
    { id: "e10", t: "Puños al cuello", zona: "Bíceps y hombros", cat: "brazos", pos: "pie", nivel: "suave", dosis: "15 veces",
      como: "Erguido, con los brazos en cruz y los puños cerrados. Dobla los codos con energía hasta acercar los puños al cuello, por encima de los hombros, y vuelve a estirar.",
      resp: "Toma aire al doblar los brazos y suéltalo al estirarlos.", trabaja: "Brazos y hombros." },
    { id: "e11", t: "Paso adelante", zona: "Piernas", cat: "piernas", pos: "pie", nivel: "medio", dosis: "10 por pierna",
      como: "Erguido, con las manos en la cintura. Da un paso largo hacia delante flexionando la pierna y vuelve a la posición inicial. Alterna las piernas.",
      resp: "Toma aire al dar el paso y suéltalo al volver.", trabaja: "Piernas y muslos.", prec: "La rodilla de delante queda encima del pie. Si te cuesta, da un paso más corto." },
    { id: "e12", t: "Las dos piernas arriba", zona: "Abdomen y cadera", cat: "abd", pos: "suelo", nivel: "exigente", dosis: "Empieza con 5 y sube poco a poco hasta 15",
      como: "Tumbado boca arriba, con los brazos junto al cuerpo. Sube las dos piernas juntas hasta la vertical y bájalas despacio.",
      resp: "Toma aire al subir las piernas y suéltalo al bajarlas.", trabaja: "Abdomen y flexores de la cadera.", prec: "Si notas tirantez en la zona lumbar, flexiona un poco las rodillas o sube una pierna cada vez." },
    { id: "e13", t: "Rodilla al pecho de pie", zona: "Piernas y vientre", cat: "piernas", pos: "pie", nivel: "medio", dosis: "10 por pierna",
      como: "De pie, sube una rodilla hacia el pecho y abrázala con las manos para acercarla un poco más. Baja y cambia de pierna.",
      resp: "Toma aire al subir la pierna y suéltalo al bajarla.", trabaja: "Piernas, cadera y abdomen.", prec: "Ten una pared o una silla cerca para apoyarte si lo necesitas." },
    { id: "e14", t: "Rotación de cuello", zona: "Cuello", cat: "cintura", pos: "pie", nivel: "exigente", dosis: "5–10 por lado",
      como: "Erguido, con las manos en la cintura. Mueve la cabeza dibujando un círculo imaginario, primero hacia la derecha y después hacia la izquierda.",
      resp: "Respira con normalidad.", trabaja: "Movilidad del cuello.", prec: "Hazlo muy despacio y con círculos pequeños. No lo hagas si tienes problemas de cervicales, mareo o vértigo." },
    { id: "e15", t: "Brazos cruzados que se abren", zona: "Respiración y pecho", cat: "resp", pos: "pie", nivel: "suave", dosis: "10 veces",
      como: "Erguido, con los brazos cruzados por delante del cuerpo y una muñeca sobre la otra. Sube los brazos y ábrelos hasta formar una cruz, estirándolos todo lo posible.",
      resp: "Toma aire al abrir los brazos y suéltalo al cerrarlos.", trabaja: "Pecho, hombros y respiración." },
    { id: "e16", t: "Flexiones apoyado en una silla", zona: "Brazos y hombros", cat: "brazos", pos: "pie", nivel: "medio", mat: "Silla firme", dosis: "10 veces",
      como: "Con el cuerpo recto y las piernas juntas, inclínate hacia delante y apoya las manos en el borde de una silla. Dobla los brazos hasta acercar el pecho al borde y vuelve a empujar.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Brazos, hombros y pecho.", prec: "Apoya la silla contra la pared para que no se mueva." },
    { id: "e17", t: "Mano a la rodilla contraria", zona: "Cintura", cat: "cintura", pos: "pie", nivel: "medio", dosis: "10 por lado",
      como: "Erguido, con los brazos en cruz y las piernas un poco separadas. Inclínate y gira para tocar la rodilla izquierda con la mano derecha. Vuelve arriba y repite hacia el otro lado.",
      resp: "Toma aire arriba y suéltalo al inclinarte.", trabaja: "Cintura y espalda.", prec: "Dobla un poco las rodillas si notas tirantez en la espalda." },
    { id: "e18", t: "Salida de velocista", zona: "Piernas y caderas", cat: "piernas", pos: "suelo", nivel: "exigente", dosis: "15 cambios",
      como: "Colócate como en la salida de una carrera: manos en el suelo, una pierna doblada bajo el pecho y la otra estirada atrás. Cambia la posición de las piernas sin moverte del sitio, cargando el peso en los brazos.",
      resp: "Toma aire al estirar la pierna derecha y suéltalo al encogerla.", trabaja: "Muslos, caderas y hombros.", prec: "Exige mucho al corazón y a las muñecas. Empieza despacio y con pocos cambios." },
    { id: "e19", t: "Molinos con los brazos", zona: "Cintura y brazos", cat: "brazos", pos: "sentado", nivel: "suave", mat: "Taburete", dosis: "15 vueltas",
      como: "Sentado en un taburete, dibuja grandes círculos con los brazos como las aspas de un molino. Los brazos van siempre en direcciones opuestas.",
      resp: "Toma aire al subir el brazo derecho y suéltalo al subir el izquierdo.", trabaja: "Hombros, brazos y tronco." },
    { id: "e20", t: "Piernas alternas sentado en el suelo", zona: "Piernas y abdomen", cat: "abd", pos: "suelo", nivel: "medio", dosis: "2 series de 10",
      como: "Sentado en el suelo, con las manos apoyadas detrás. Dobla y estira las piernas por turnos, derecha e izquierda, sin que toquen el suelo. Haz 10, descansa y haz otras 10.",
      resp: "Respira al ritmo de las piernas.", trabaja: "Abdomen y piernas." },
    { id: "e21", t: "Incorporarse hasta los pies", zona: "Abdomen y espalda", cat: "abd", pos: "suelo", nivel: "exigente", dosis: "10 veces",
      como: "Tumbado boca arriba, con los brazos estirados por detrás de la cabeza. Levanta el tronco y estírate hacia delante hasta tocar los pies con la punta de los dedos. Vuelve a tumbarte despacio.",
      resp: "Suelta el aire al inclinarte y tómalo al volver.", trabaja: "Abdomen, espalda y muslos.", prec: "Sube sin tirones. Si no llegas a los pies, toca las rodillas o las espinillas." },
    { id: "e22", t: "Brazos en cruz", zona: "Respiración y pecho", cat: "resp", pos: "pie", nivel: "suave", dosis: "10 veces",
      como: "Erguido, con los brazos pegados al cuerpo. Súbelos por los lados hasta la altura de los hombros, en cruz, y bájalos.",
      resp: "Toma aire al subir los brazos y suéltalo al bajarlos.", trabaja: "Hombros y respiración." },
    { id: "e23", t: "Mano al pie contrario", zona: "Cintura y caderas", cat: "cintura", pos: "pie", nivel: "medio", dosis: "10 por mano",
      como: "De pie con las piernas bien separadas y los brazos en cruz. Inclínate hacia delante hasta tocar el pie izquierdo con la mano derecha. Sube y repite hacia el otro lado.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Cintura, caderas y parte posterior de las piernas.", prec: "Dobla un poco las rodillas si no llegas. Sube despacio para evitar mareos." },
    { id: "e24", t: "Flexiones con las rodillas apoyadas", zona: "Brazos y tórax", cat: "brazos", pos: "suelo", nivel: "medio", dosis: "10 veces",
      como: "Boca abajo, con las manos a la altura de las axilas y las rodillas en el suelo. Sube el cuerpo recto de la cabeza a las rodillas y baja hasta rozar el suelo con el pecho, sin apoyarlo.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Brazos, muñecas y pecho." },
    { id: "e25", t: "Balanceo de pierna", zona: "Piernas y cintura", cat: "piernas", pos: "pie", nivel: "medio", mat: "Silla (opcional)", dosis: "10 por pierna",
      como: "Erguido, con las manos en la cintura. Balancea una pierna hacia delante y hacia atrás todo lo que puedas y luego cambia. Si te cuesta el equilibrio, apóyate con una mano en una silla o en la pared.",
      resp: "Toma aire al llevar la pierna adelante y suéltalo al llevarla atrás.", trabaja: "Piernas, cadera y equilibrio." },
    { id: "e26", t: "Piernas por encima de la cabeza", zona: "Abdomen y espalda", cat: "abd", pos: "suelo", nivel: "exigente", dosis: "10 veces",
      como: "Tumbado boca arriba, con los brazos a los lados. Sube las dos piernas estiradas y llévalas hacia atrás, por encima de la cabeza, hasta tocar el suelo con los pies si puedes.",
      resp: "Toma aire al subir las piernas y suéltalo al bajarlas.", trabaja: "Abdomen y flexibilidad de la espalda.", prec: "Es una postura muy intensa para el cuello. No la hagas si tienes problemas de cervicales, de espalda o tensión alta. No gires la cabeza." },
    { id: "e27", t: "Brazos cruzados que suben y se abren", zona: "Respiración y tórax", cat: "resp", pos: "pie", nivel: "suave", dosis: "10 veces",
      como: "Erguido, con los brazos cruzados por delante y una muñeca sobre la otra. Súbelos por encima de la cabeza y ábrelos en forma de V, estirándolos todo lo posible. Bájalos despacio.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Hombros, pecho y respiración." },
    { id: "e28", t: "Flexiones completas", zona: "Tórax y hombros", cat: "brazos", pos: "suelo", nivel: "exigente", dosis: "Empieza con 5; con el tiempo, 15–20",
      como: "Boca abajo, apoyado en las manos y en las puntas de los pies. Con el cuerpo recto, baja y sube sin tocar el suelo con el pecho.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Muñecas, brazos, hombros, pecho y tronco.", prec: "Si no mantienes el cuerpo recto, haz el ejercicio 24, con las rodillas apoyadas." },
    { id: "e29", t: "Tocar el suelo con las piernas rectas", zona: "Espalda y abdomen", cat: "cintura", pos: "pie", nivel: "exigente", dosis: "10 veces",
      como: "Erguido, con los brazos arriba y las piernas juntas. Inclínate hacia delante hasta tocar el suelo delante de los pies con la punta de los dedos, sin doblar las rodillas. Con el tiempo podrás apoyar la palma.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Espalda, parte posterior de las piernas y abdomen.", prec: "Sin rebotes. Si no llegas, dobla un poco las rodillas. Sube despacio para evitar mareos." },
    { id: "e30", t: "Incorporarse con los pies en alto", zona: "Cintura y abdomen", cat: "abd", pos: "suelo", nivel: "exigente", mat: "Silla baja o caja de unos 40 cm", dosis: "5–10 veces",
      como: "Tumbado boca arriba, con los brazos por detrás de la cabeza y los pies sobre una silla baja de unos 40 cm. Levanta el tronco y estírate hasta tocar los pies con la punta de los dedos.",
      resp: "Toma aire al estirarte y suéltalo al doblarte.", trabaja: "Abdomen, cintura y piernas.", prec: "Sube sin tirones. Si no llegas, toca las rodillas." },
    { id: "e31", t: "Inclinación lateral sentado", zona: "Cintura y columna", cat: "cintura", pos: "sentado", nivel: "suave", mat: "Taburete", dosis: "10 por lado",
      como: "Sentado en un taburete o un asiento sin respaldo, con las manos en la nuca. Inclínate a la derecha y a la izquierda manteniendo la espalda recta.",
      resp: "Toma aire hacia un lado y suéltalo hacia el otro.", trabaja: "Cintura y espalda." },
    { id: "e32", t: "Abdominal completo con los pies sujetos", zona: "Abdomen y columna", cat: "abd", pos: "suelo", nivel: "exigente", mat: "Un mueble bajo para sujetar los pies", dosis: "5–10 veces",
      como: "Tumbado boca arriba, con las piernas juntas y estiradas y las manos en la nuca. Levanta el tronco e inclínate hasta acercar los codos a las rodillas. Al principio necesitarás que alguien te sujete los pies, o meterlos bajo un mueble.",
      resp: "Suelta el aire al subir y tómalo al bajar.", trabaja: "Abdomen y espalda.", prec: "El libro lo llama «muy duro». No tires de la cabeza con las manos y sube despacio. Si notas molestias lumbares, cambia al ejercicio 21." },
    { id: "e33", t: "Saltitos con las piernas flexionadas", zona: "Abdomen y piernas", cat: "piernas", pos: "pie", nivel: "exigente", dosis: "10 saltitos",
      como: "Con las piernas flexionadas y las manos en la cintura, da saltitos pequeños con los dos pies a la vez, sin desplazarte.",
      resp: "Respira con normalidad.", trabaja: "Piernas, abdomen y equilibrio.", prec: "Hazlo sobre un suelo que no resbale y aterriza con suavidad. Evítalo si tienes problemas de rodillas o de suelo pélvico." },
    { id: "e34", t: "Tijeras en el suelo", zona: "Caderas y abdomen", cat: "abd", pos: "suelo", nivel: "exigente", dosis: "Hasta notar cansancio, sin agotarte",
      como: "Tumbado boca arriba, con las manos un poco por debajo de las nalgas. Sube las piernas a media altura y muévelas arriba y abajo por turnos, unos 30 cm, sin tocar el suelo, como unas tijeras. Descansa y repite un poco más.",
      resp: "Respira al ritmo de las piernas.", trabaja: "Abdomen, caderas y piernas.", prec: "Si se arquea la zona lumbar, sube más las piernas o hazlo con menos recorrido." },
    { id: "e35", t: "Arriba de puntillas y abajo en cruz", zona: "Respiración, equilibrio y piernas", cat: "piernas", pos: "pie", nivel: "exigente", dosis: "10 veces",
      como: "Erguido, sube los brazos mientras te pones de puntillas hasta juntar las manos arriba, como si quisieras tocar el techo. Después baja los brazos en cruz mientras flexionas del todo las piernas, sin dejar de estar de puntillas.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Piernas, equilibrio y respiración.", prec: "Ten una silla cerca. Baja solo hasta donde controles el movimiento." },
    { id: "e36", t: "Cadera arriba sentado en el suelo", zona: "Brazos y abdomen", cat: "brazos", pos: "suelo", nivel: "medio", dosis: "10 veces",
      como: "Sentado en el suelo, con las rodillas dobladas y las manos apoyadas detrás. Levanta la cadera todo lo que puedas, sosteniéndote en las manos y los pies, y baja.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Brazos, glúteos y abdomen." },
    { id: "e37", t: "Fondos en una silla", zona: "Brazos y hombros", cat: "brazos", pos: "sentado", nivel: "exigente", mat: "Silla firme", dosis: "10 veces",
      como: "De espaldas a una silla, apoya las manos en el borde del asiento con las piernas juntas y estiradas. Dobla los brazos bajando el cuerpo hasta quedar casi sentado en el suelo y vuelve a subir.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Brazos y hombros.", prec: "La silla debe estar apoyada contra la pared. Evítalo si te duelen los hombros. Para que cueste menos, dobla las rodillas." },
    { id: "e38", t: "Giro sentado hasta el pie", zona: "Cintura y columna", cat: "cintura", pos: "suelo", nivel: "medio", dosis: "10 veces",
      como: "Sentado en el suelo, con las piernas bien separadas y los brazos en cruz. Gira e inclínate hasta tocar el pie izquierdo con la mano derecha. Vuelve y repite hacia el otro lado.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Espalda y cintura.", prec: "Si no llegas al pie, toca la rodilla o la espinilla." },
    { id: "e39", t: "Sentadilla a una pierna con apoyo", zona: "Piernas", cat: "piernas", pos: "pie", nivel: "exigente", mat: "Silla firme", dosis: "5–10 por pierna",
      como: "De pie, apoya una mano en el respaldo de una silla. Flexiona la pierna del mismo lado mientras mantienes la otra estirada al frente. Sube y cambia de lado.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Piernas y equilibrio.", prec: "Muy exigente para las rodillas. Baja solo un poco al principio y apóyate bien en la silla." },
    { id: "e40", t: "Cabeza a la rodilla sentado", zona: "Columna y cintura", cat: "cintura", pos: "suelo", nivel: "exigente", dosis: "5 por lado",
      como: "Sentado en el suelo, con las piernas separadas y las manos en la nuca. Gira hacia un lado y llévate la cabeza hacia la rodilla. Vuelve y repite hacia el otro lado.",
      resp: "Toma aire al subir y suéltalo al bajar.", trabaja: "Espalda, cintura y muslos.", prec: "No tires del cuello con las manos. Llega solo hasta donde puedas sin forzar." },
    { id: "e41", t: "Caminar a cuatro patas", zona: "Piernas, brazos y muñecas", cat: "brazos", pos: "suelo", nivel: "exigente", dosis: "Hasta notar cansancio",
      como: "Con las manos en el suelo y las piernas y los brazos rectos, camina con energía apoyándote en manos y pies.",
      resp: "Respira por la nariz.", trabaja: "Piernas, brazos, hombros y muñecas.", prec: "Exige mucho a las muñecas y la cabeza queda baja. Para si te mareas." },
    { id: "e42", t: "Bastón por encima de la cabeza", zona: "Espalda y hombros", cat: "brazos", pos: "sentado", nivel: "suave", mat: "Taburete y bastón", dosis: "10 veces",
      como: "Sentado en un taburete, sujeta un bastón por delante, cerca del pecho. Pásalo por encima de la cabeza y bájalo por detrás todo lo que puedas sin forzar. Vuelve adelante.",
      resp: "Toma aire al llevarlo atrás y suéltalo al traerlo adelante.", trabaja: "Espalda y hombros.", prec: "Agarra el bastón con las manos bien separadas. Si notas molestias en el hombro, quédate encima de la cabeza." }
  ];
  EJ.forEach((e, i) => { e.n = i + 1; });
  const ACT = { id: "act", t: "Activación" };
  const CALMA = { id: "calma", t: "Vuelta a la calma" };
  const BYID = Object.fromEntries(EJ.map((e) => [e.id, e]));
  const POS = { pie: "De pie", sentado: "Sentado", suelo: "En el suelo" };
  const NIV = { suave: "Suave", medio: "Medio", exigente: "Exigente" };

  /* Figura animada realista (figura.js + movimientos.js) */
  /* Primero se dibuja la ilustración SVG; cuando el motor 3D está listo,
     se sustituye por la persona en 3D (figura3d.js). */
  const pending3d = [];
  function figure(ex, big) {
    const data = Object.assign({}, window.MOV[ex.id], { t: ex.t, id: ex.id });
    const box = document.createElement("div");
    box.className = "fig-box" + (big ? " fig-box--big" : "");
    box._data = data; box._big = !!big;
    box.appendChild(window.Figura.mount(data, { big }));
    pending3d.push(box); upgrade3d();
    return box;
  }
  function upgrade3d() {
    if (!window.Figura3D) return;
    while (pending3d.length) {
      const box = pending3d.shift(), svg = box.querySelector("svg");
      if (svg) window.Figura.unmount(svg);
      window.Figura3D.mount(box, box._data, { big: box._big });
    }
  }
  window.addEventListener("figura3d-ready", upgrade3d);
  function dropFigure(box) {
    if (!box) return;
    window.Figura3D?.unmount(box);
    const svg = box.querySelector("svg"); if (svg) window.Figura.unmount(svg);
    const i = pending3d.indexOf(box); if (i >= 0) pending3d.splice(i, 1);
  }

  /* ------------------------------------------------------------------
     TARJETAS DE EJERCICIOS
     ------------------------------------------------------------------ */
  const PRESETS = {
    suave: ["e1", "e22", "e7", "e10", "e15", "e2", "e9", "e19", "e31", "e6", "e42", "e27"],
    medio: ["e1", "e7", "e2", "e3", "e11", "e16", "e17", "e4", "e24", "e36", "e20", "e25"],
    exigente: ["e1", "e15", "e23", "e29", "e35", "e28", "e12", "e21", "e37", "e39", "e34", "e18"]
  };
  const sel = new Set(store.get("gym-sel42", PRESETS.suave).filter((id) => BYID[id]));
  const grid = $("#ex-grid");
  EJ.forEach((e) => {
    const card = document.createElement("article");
    card.className = "ex";
    card.id = "ej-" + e.n;
    card.dataset.cat = e.cat;
    card.dataset.pos = e.pos;
    card.dataset.niv = e.nivel;
    card.innerHTML = `
      <div class="ex__fig"><span class="ex__n">${e.n}</span></div>
      <div class="ex__body">
        <div class="ex__tags"><span class="tag tag--${e.nivel}">${NIV[e.nivel]}</span>
          <span class="tag tag--pos">${POS[e.pos]}</span>${e.mat ? `<span class="tag tag--mat">🧰 ${esc(e.mat)}</span>` : ""}</div>
        <p class="ex__zona">${esc(e.zona)}</p>
        <h3>${esc(e.t)}</h3>
        <p class="ex__dose">⏱ ${esc(e.dosis)}</p>
        <p>${esc(e.como)}</p>
        ${e.prec ? `<p class="ex__prec">⚠️ ${esc(e.prec)}</p>` : ""}
        <details><summary>Respiración y qué trabaja</summary>
          <p><strong>Respiración:</strong> ${esc(e.resp)}</p>
          <p><strong>Trabaja:</strong> ${esc(e.trabaja)}</p>
        </details>
        <label class="pick"><input type="checkbox" value="${e.id}" ${sel.has(e.id) ? "checked" : ""}> En mi sesión</label>
      </div>`;
    $(".ex__fig", card).prepend(figure(e));
    grid.appendChild(card);
  });

  // Filtros: zona, posición y nivel
  const F = { cat: "", pos: "", niv: "" };
  function applyFilter() {
    let n = 0;
    $$(".ex", grid).forEach((c) => {
      const ok = Object.keys(F).every((k) => !F[k] || c.dataset[k] === F[k]);
      c.hidden = !ok; if (ok) n++;
    });
    for (const k of Object.keys(F)) $$(`#ex-filters [data-${k}]`).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset[k] === F[k])));
    $("#ex-count").textContent = n === EJ.length ? `Mostrando los ${n} ejercicios` : `Mostrando ${n} de ${EJ.length}`;
  }
  $("#ex-filters").addEventListener("click", (ev) => {
    const b = ev.target.closest("button"); if (!b) return;
    if ("reset" in b.dataset) { F.cat = F.pos = F.niv = ""; }
    for (const k of Object.keys(F)) if (k in b.dataset) F[k] = b.dataset[k] === F[k] ? "" : b.dataset[k];
    applyFilter();
  });
  applyFilter();

  // Selección para la sesión
  function syncSel() {
    store.set("gym-sel42", [...sel]);
    $$(".pick input", grid).forEach((i) => { i.checked = sel.has(i.value); i.closest(".ex").classList.toggle("is-picked", i.checked); });
    const n = sel.size, min = Math.round(3 + n * 1.5 + 3);
    $("#sel-count").textContent = n ? `${n} ejercicio${n === 1 ? "" : "s"} · unos ${min} minutos` : "Elige al menos un ejercicio";
    $("#start").disabled = !n;
    $$("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", "false"));
  }
  grid.addEventListener("change", (ev) => {
    const i = ev.target.closest(".pick input"); if (!i) return;
    i.checked ? sel.add(i.value) : sel.delete(i.value); syncSel();
  });
  $$("[data-preset]").forEach((b) => b.addEventListener("click", () => {
    sel.clear(); PRESETS[b.dataset.preset].forEach((id) => sel.add(id)); syncSel();
    b.setAttribute("aria-pressed", "true");
  }));
  syncSel();

  /* ------------------------------------------------------------------
     SESIÓN GUIADA
     ------------------------------------------------------------------ */
  const ov = $("#session");
  let steps = [], idx = 0, left = 0, paused = false, tick = null, wake = null, sFig = null;
  function buildSteps() {
    const chosen = EJ.filter((e) => sel.has(e.id));
    steps = [{ ex: ACT, title: "Activación", text: "Camina de puntillas, camina sobre los talones y corre suave en el sitio de puntillas (complemento del ejercicio 6). Ve a tu ritmo.", dose: "3 minutos", dur: 180, warm: true }]
      .concat(chosen.map((e) => ({ ex: e, title: `${e.n}. ${e.t}`, text: e.como, dose: e.dosis, easy: e.prec ? "⚠️ " + e.prec : "🌬 " + e.resp, dur: 90 })))
      .concat([{ ex: CALMA, title: "Vuelta a la calma", text: "Repite el ejercicio 1 muy despacio: sube los brazos tomando aire y bájalos soltándolo. Deja que el pulso se calme.", dose: "3 minutos", dur: 180 }]);
  }
  let actx = null;
  function beep(f = 880, d = 0.18) {
    if (!$("#snd").checked) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(0.0001, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, actx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d);
      o.start(); o.stop(actx.currentTime + d + 0.02);
    } catch { /* sin audio */ }
  }
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  function renderStep() {
    const s = steps[idx];
    $("#s-count").textContent = `Paso ${idx + 1} de ${steps.length}`;
    $("#s-bar").style.width = `${(idx / (steps.length - 1)) * 100}%`;
    $("#s-title").textContent = s.title;
    $("#s-text").textContent = s.text;
    $("#s-dose").textContent = s.dose;
    $("#s-easy").hidden = !s.easy;
    $("#s-easy").textContent = s.easy || "";
    const nx = steps[idx + 1];
    $("#s-next").textContent = nx ? `Siguiente: ${nx.title}` : "Último paso";
    const box = $("#s-fig"); box.innerHTML = "";
    dropFigure(sFig);
    sFig = figure(s.ex, true); box.appendChild(sFig);
    $("#s-prev").disabled = idx === 0;
    $("#s-skip").textContent = nx ? "Siguiente ⏭" : "Terminar ✓";
    left = s.dur; paused = false; updTimer();
  }
  function updTimer() {
    const s = steps[idx], frac = s ? left / s.dur : 0;
    $("#s-time").textContent = mmss(left);
    $("#s-ring").style.strokeDashoffset = String(339.3 * (1 - frac));
    $("#s-pause").textContent = paused ? "▶ Seguir" : "⏸ Pausa";
  }
  function next() {
    if (idx < steps.length - 1) { idx++; beep(988); renderStep(); }
    else finish();
  }
  function finish() {
    beep(1175, 0.3);
    stopSession(false);
    markToday();
    $("#done").hidden = false;
    $("#done").scrollIntoView({ behavior: "smooth", block: "center" });
    window.track?.("gym/sesion-completada", "Sesión de gimnasia completada");
  }
  async function startSession() {
    buildSteps(); idx = 0;
    ov.hidden = false; document.body.classList.add("no-scroll");
    renderStep(); beep(660);
    clearInterval(tick);
    tick = setInterval(() => {
      if (paused) return;
      left = Math.max(0, left - 1);
      if (left <= 3 && left > 0) beep(520, 0.08);
      updTimer();
      if (left === 0) next();
    }, 1000);
    try { wake = await navigator.wakeLock?.request("screen"); } catch { wake = null; }
    $("#s-close").focus();
    window.track?.("gym/sesion-iniciada", "Sesión de gimnasia iniciada");
  }
  function stopSession(focusBack = true) {
    clearInterval(tick); tick = null;
    ov.hidden = true; document.body.classList.remove("no-scroll");
    try { wake?.release(); } catch { /* nada */ } wake = null;
    if (focusBack) $("#start").focus();
  }
  $("#start").addEventListener("click", startSession);
  $("#s-close").addEventListener("click", () => stopSession());
  $("#s-pause").addEventListener("click", () => { paused = !paused; updTimer(); });
  $("#s-skip").addEventListener("click", next);
  $("#s-prev").addEventListener("click", () => { if (idx > 0) { idx--; renderStep(); } });
  $("#s-plus").addEventListener("click", () => { left += 15; steps[idx].dur = Math.max(steps[idx].dur, left); updTimer(); });
  document.addEventListener("keydown", (e) => {
    if (ov.hidden) return;
    if (e.key === "Escape") stopSession();
    if (e.key === " ") { e.preventDefault(); paused = !paused; updTimer(); }
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft" && idx > 0) { idx--; renderStep(); }
  });

  /* ------------------------------------------------------------------
     MI SEMANA (se guarda solo en este navegador)
     ------------------------------------------------------------------ */
  const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  function weekKey(d = new Date()) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return `gym-week-${t.getUTCFullYear()}-${Math.ceil(((t - y0) / 864e5 + 1) / 7)}`;
  }
  const todayIdx = (new Date().getDay() + 6) % 7;
  let week = store.get(weekKey(), [0, 0, 0, 0, 0, 0, 0]);
  const LV = ["", "move", "str"]; // 0 nada · 1 me moví · 2 fuerza
  function renderWeek() {
    $("#week").innerHTML = DIAS.map((d, i) => `
      <button type="button" class="day day--${LV[week[i]] || "none"} ${i === todayIdx ? "is-today" : ""}" data-i="${i}"
        aria-label="${d}: ${["sin registrar", "me moví", "hice fuerza"][week[i]]}">
        <span>${d}</span><b>${["·", "🚶", "💪"][week[i]]}</b></button>`).join("");
    const moved = week.filter(Boolean).length, str = week.filter((v) => v === 2).length;
    $("#week-sum").innerHTML = `Días activos: <strong>${moved}/7</strong> · Días de fuerza: <strong>${str}</strong>` +
      (str >= 2 ? " · ¡Objetivo de fuerza cumplido! 🎉" : ` · Te falta${2 - str === 1 ? "" : "n"} ${2 - str} para el objetivo de fuerza`);
  }
  $("#week").addEventListener("click", (e) => {
    const b = e.target.closest(".day"); if (!b) return;
    const i = +b.dataset.i; week[i] = (week[i] + 1) % 3; store.set(weekKey(), week); renderWeek();
  });
  function markToday() { week[todayIdx] = 2; store.set(weekKey(), week); renderWeek(); }
  renderWeek();

  /* ------------------------------------------------------------------
     CHECKLIST DE SEGURIDAD
     ------------------------------------------------------------------ */
  const chk = $$("#safety input");
  const updSafe = () => {
    const n = chk.filter((c) => c.checked).length;
    $("#safe-state").textContent = n === chk.length ? "✓ Todo listo. ¡A moverse!" : `${n} de ${chk.length} comprobados`;
    $("#safe-state").classList.toggle("is-ok", n === chk.length);
  };
  chk.forEach((c) => c.addEventListener("change", updSafe)); updSafe();

  /* ------------------------------------------------------------------
     CARTEL DE INVITACIÓN
     ------------------------------------------------------------------ */
  const INV = store.get("gym-inv", { lugar: "", cuando: "", contacto: "" });
  ["lugar", "cuando", "contacto"].forEach((k) => {
    const i = $("#inv-" + k); i.value = INV[k] || "";
    i.addEventListener("input", () => { INV[k] = i.value; store.set("gym-inv", INV); renderInv(); });
  });
  const val = (k, d) => (INV[k] || "").trim() || d;
  function renderInv() {
    $("#p-lugar").textContent = val("lugar", "[Lugar]");
    $("#p-cuando").textContent = val("cuando", "[Día y hora]");
    $("#p-contacto").textContent = val("contacto", "[Contacto]");
  }
  renderInv();
  const pageUrl = location.origin + location.pathname;
  function invText() {
    return `🌿 *Gimnasia para todos* — encuentro comunitario de gimnasia suave\n\n` +
      `¿Te gustaría moverte un poco más y hacerlo acompañado? Practicaremos ejercicios de gimnasia en tres niveles (suave, medio y exigente), cada uno a su ritmo y con pausas. Solo necesitas ropa cómoda, agua y ganas de participar.\n\n` +
      `📍 ${val("lugar", "[Lugar]")}\n🗓 ${val("cuando", "[Día y hora]")}\n📞 ${val("contacto", "[Contacto]")}\n\n` +
      `Si tienes una lesión o una condición de salud, consulta antes con tu profesional sanitario.\nGuía: ${pageUrl}\n\nVen como eres; empezamos paso a paso.`;
  }
  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status");
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  }
  $("#inv-copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(invText()); toast("Texto copiado: pégalo en WhatsApp"); }
    catch { prompt("Copia este texto:", invText()); }
    window.track?.("gym/invitacion-copiada", "Invitación copiada");
  });
  $("#inv-wa").addEventListener("click", () => {
    window.open("https://wa.me/?text=" + encodeURIComponent(invText()), "_blank", "noopener");
    window.track?.("gym/invitacion-whatsapp", "Invitación por WhatsApp");
  });
  $("#inv-print").addEventListener("click", () => {
    document.body.classList.add("print-poster"); window.print();
    setTimeout(() => document.body.classList.remove("print-poster"), 500);
    window.track?.("gym/cartel-impreso", "Cartel impreso");
  });
  window.addEventListener("afterprint", () => document.body.classList.remove("print-poster"));
  $("#poster-fig").appendChild(figure(BYID.e27));

  /* Figuras decorativas de la portada */
  $("#hero-fig-1").appendChild(figure(BYID.e11));
  $("#hero-fig-2").appendChild(figure(BYID.e16));
  $("#hero-fig-3").appendChild(figure(BYID.e23));

  /* Tema (compartido con el resto de la web) */
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch { /* nada */ }
  $(".theme-toggle").addEventListener("click", () => {
    const d = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const n = d ? "light" : "dark";
    document.documentElement.dataset.theme = n;
    try { localStorage.setItem("theme", n); } catch { /* nada */ }
  });
})();
