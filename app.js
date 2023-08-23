const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

function delay(t, v) {
  return new Promise(function(resolve) { 
      setTimeout(resolve.bind(null, v), t)
  });
}

app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: true
}));
app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

client.initialize();

io.on('connection', function(socket) {
  socket.emit('message', '© Bona-Bot iniciado');
  socket.emit('qr', './icon.svg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© Bona-Bot QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', '© Bona-Bot Dispositivo pronto!');
    socket.emit('message', '© Bona-Bot Dispositivo pronto!');
    socket.emit('qr', './check.svg')	
    console.log('© Bona-Bot Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', '© Bona-Bot Autenticado!');
    socket.emit('message', '© Bona-Bot Autenticado!');
    console.log('© Bona-Bot Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', '© Bona-Bot Falha na autenticação, reiniciando...');
    console.error('© Bona-Bot Falha na autenticação');
});

client.on('change_state', state => {
  console.log('© Bona-Bot Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', '© Bona-Bot Cliente desconectado!');
  console.log('© Bona-Bot Cliente desconectado', reason);
  client.initialize();
});
});

// Send message
app.post('/zdg-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const message = req.body.message;

  if (numberDDI !== "55") {
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'Bona-Bot Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Bona-Bot Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'Bona-Bot Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Bona-Bot Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'Bona-Bot Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Bona-Bot Mensagem não enviada',
      response: err.text
    });
    });
  }
});


// Send media
app.post('/zdg-media', [
  body('number').notEmpty(),
  body('caption').notEmpty(),
  body('file').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  if (numberDDI !== "55") {
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'Bona-Bot Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Bona-Bot Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'Bona-Bot Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Bona-Bot Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'Bona-Bot Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'Bona-Bot Imagem não enviada',
      response: err.text
    });
    });
  }
});

client.on('message', async msg => {

  const nomeContato = msg._data.notifyName;
  let groupChat = await msg.getChat();
  
  if (groupChat.isGroup) return null;

  if (msg.type.toLowerCase() == "e2e_notification") return null;
  
  if (msg.body == "") return null;
  
  if (msg.from.includes("@g.us")) return null;

  if (msg.body !== null && msg.body === "1") {
    //msg.reply("*COMUNIDADE ZDG*\n\n🤪 _Usar o WPP de maneira manual é prejudicial a saúde_\r\n\r\nhttps://comunidadezdg.com.br/ \r\n\r\n⏱️ As inscrições estão *ABERTAS*\n\nAssista o vídeo abaixo e entenda porque tanta gente comum está economizando tempo e ganhando dinheiro explorando a API do WPP, mesmo sem saber nada de programação.\n\n📺 https://youtu.be/mr0BvO9quhw");
    msg.reply("🛍️ Atacado \r\n\r\ Se você está interessado em comprar nossos produtos no atacado, você está no lugar certo!\r\n\r\ Oferecemos descontos especiais para compras em grande quantidade. \r\n\r\ Por favor, nos forneça mais detalhes sobre o que você está procurando, e teremos prazer em ajudar.")
  } 
  
  else if (msg.body !== null && msg.body === "2") {
    msg.reply("*" + nomeContato + "*🔄 Políticas de Troca \r\n\r\ Nossas políticas de troca foram projetadas para garantir sua satisfação. Caso deseje saber mais sobre como funcionam as trocas de produtos, prazos e condições, você está no lugar certo. \r\n\r\ Informe-nos sobre o produto em questão, e explicaremos o procedimento em detalhes.");
  }
  
  else if (msg.body !== null && msg.body === "3") {
    msg.reply("*" + nomeContato + "*, " + "Ficamos felizes em saber que você está interessado em nossas promoções! Temos diversas ofertas incríveis em nosso catálogo.\r\n\r\ Poderia nos dizer qual tipo de produtos você está procurando ou se há alguma promoção específica que gostaria de conhecer?");
  }
  
  else if (msg.body !== null && msg.body === "4") {

        const contact = await msg.getContact();
        setTimeout(function() {
            msg.reply(`@${contact.number}` + ' seu contato já foi encaminhado para o nosso atendimento');  
            client.sendMessage('554799102659c.us','Contato Essenciais. https://wa.me/' + `${contact.number}`);
	    //client.sendMessage('5515998566622@c.us',`${contact.number}`);
          },1000 + Math.floor(Math.random() * 1000));
  
  }
  
  else if (msg.body !== null && msg.body === "4") {
    msg.reply("👤 Atendimento Humano \n\n Perfeito! Encaminharemos você para um atendente humano que poderá ajudar com suas perguntas de maneira mais direta. \n\nAguarde um momento, por favor.");
  }
  
  else if (msg.body !== null && msg.body === "6") {
    msg.reply("*" + nomeContato + "*, " + " 💳 Formas de Pagamento \n\n Oferecemos diversas opções de pagamento para tornar suas compras mais convenientes. Por favor, nos informe quais são suas preferências de pagamento, e explicaremos as opções disponíveis em detalhes.");
  }
  
  else if (msg.body !== null && msg.body === "7") {
    msg.reply("*" + nomeContato + "*, " + ", ❓ FAQ (Perguntas Frequentes) \n\n Nossa seção de Perguntas Frequentes contém informações valiosas sobre diversos tópicos. Se você deseja encontrar respostas rápidas, você pode conferir nossa seção FAQ em nosso site. Caso não encontre a informação que procura, não hesite em perguntar.");
  }

  else if (msg.body !== null && msg.body === "8") {
    msg.reply("😁 Sure! If you prefer to continue in English, please let us know how we can assist you. Feel free to ask your questions or share your concerns, and we'll be happy to help you.");
  }
  
  else if (msg.body !== null && msg.body === "9") {
    msg.reply("In the ZDG Community, you will integrate APIs, automate with chatbots, and implement multi-user support systems for WhatsApp. With ready-to-use scripts and daily support in the student group.\n\nhttps://comunidadezdg.com.br/\n\n⏱️ Registrations are OPEN\n\nWatch the video below and understand why so many ordinary people are saving time and making money by exploring the WPP API, even without knowing anything about programming.\n\n📺 https://www.youtube.com/watch?v=AoRhC_X6p5w");
  } 
  
  else if (msg.body !== null && msg.body === "10") {
    msg.reply("In the ZDG Community, you will:\n\n- Use tested codes to automate your customer service with WhatsApp chatbots\n- Create applications for CRM management and multi-user platforms for support chats\n- Learn integrations with tools and APIs that have been tested and approved by the community\n- Curate free plugins and tools to boost conversational marketing in your business\n- Connect with over 2,000 students who are also studying and implementing conversational marketing solutions\n- Aligned student groups organized by topics\n- Have access to my personal support every day.");
  }
  
  else if (msg.body !== null && msg.body === "11") {
    msg.reply("These are the main APIs that ZDG will teach you to use with WhatsApp:\nBaileys, Venom-BOT, WPPConnect, WPPWeb-JS, and Cloud API (Official API)\n\nThese are the main integrations that ZDG will teach you to do with WhatsApp:\nBubble, WordPress (WooCommerce and Elementor), Botpress, N8N, DialogFlow, ChatWoot, and platforms like Hotmart, Edduz, Monetizze, Rd Station, Mautic, Google Sheets, Active Campaign, among others.");
  }
  
  else if (msg.body !== null && msg.body === "12") {

        const contact = await msg.getContact();
        setTimeout(function() {
            msg.reply(`@${contact.number}` + ' your contact has already been forwarded to Pedrinho');  
            client.sendMessage('5515998566622@c.us','Contato ZDG - EN. https://wa.me/' + `${contact.number}`);
	    //client.sendMessage('5515998566622@c.us',`${contact.number}`);
          },1000 + Math.floor(Math.random() * 1000));
  
  }
  
  else if (msg.body !== null && msg.body === "12") {
    msg.reply("Your contact has already been forwarded to Pedrinho");
  }
  
  else if (msg.body !== null && msg.body === "13") {
    msg.reply("Enjoy the content and learn in a few minutes how to put your WPP API online, for free:\r\n\r\n🎥 https://youtu.be/sF9uJqVfWpg");
  }
  
  else if (msg.body !== null && msg.body === "15") {
    msg.reply("Great, I'll send you some success stories:\n\n📺 https://youtu.be/KHGchIAZ5i0\nGustavo: The cheapest, most efficient, and completely scalable strategy.\n\n📺 https://youtu.be/S4Cwrnn_Llk\nNatália: We increased our revenue and sold to more clients with the ZDG strategy.\n\n📺 https://youtu.be/XP2ns7TOdIQnYuri: The tool helped me a lot with automating my online store.\n\n📺 https://youtu.be/KBedG3TcBRw\nFrancisco: Pedrinho takes our hand. If I succeeded, you can too.\n\n📺 https://youtu.be/L7dEoEwqv-0\nBruno: The ZDG Community and Pedrinho`s support are incredible. After I acquired the course, I stopped spending $300.00 every month on other automations.\n\n📺 https://youtu.be/StRiSLS5ckg\nRodrigo: I`m a systems developer, and I`ve been using Pedrinho`s solutions to integrate into my systems, and the time savings are exceptional.\n\n📺 https://youtu.be/sAJUDsUHZOw\nDarley: The ZDG Community democratized the use of WPP APIs.\n\n📺 https://youtu.be/S4Cwrnn_Llk\nNatália: We increased our revenue and sold to more clients with the ZDG strategy.\n\n📺 https://youtu.be/crO8iS4R-UU\nAndré: Pedrinho shares a lot of information in the ZDG Community.\n\n📺 https://youtu.be/LDHFX32AuN0\nEdson: The return I have in my work with Pedrinho`s information made my investment free.\n\n📺 https://youtu.be/F3YahjtE7q8\nDaniel: Very high-quality content. Thank you, Professor Pedrinho.\n\n📺 https://youtu.be/YtRpGgZKjWI\nMarcelo: I have a digital agency, and with Pedrinho`s course, we created a new product and are already selling it.\n\n📺 https://youtu.be/0DlOJCg_Eso\nKleber: Pedrinho has excellent didactics, and with his course, I managed to get my API running 24 hours a day, and I`m making sales every day.\n\n📺 https://youtu.be/rsbUJrPqJeA\nMárcio: Before acquiring it, I had little knowledge, but I learned a lot about APIs with Pedrinho and the community.\n\n📺 https://youtu.be/YvlNd-dM9oo\nZé: Pedrinho has liberating content. It was the best investment I made. Unreal content.\n\n📺 https://www.youtube.com/watch?v=mHqEQp94CiE\nLéo: We integrated the ZDG Method into our launches and optimized our results.\n\n📺 https://youtu.be/pu6PpNRJyoM\nRenato: ZDG is a method that will allow you to increase your revenue by at least 30%.\n📺 https://www.youtube.com/watch?v=08wzrPorZcI\n\nGabi: I implemented the strategy without knowing anything about programming.\n📺 https://youtu.be/10cR-c5rOKE\n\nDouglas: After implementing Pedrinho`s solutions, I had a 30% increase in my revenue, not to mention that everyone helps each other in the ZDG community.\n📺 https://youtu.be/kFPhpl5uyyU\n\nDanielle: Without a doubt, meeting Pedrinho and his content was the best thing that happened to me.\n📺 https://youtu.be/3TCPRstg5M0\n\nCalebe: The Zap das Galáxias system was fundamental in the development and execution of my business strategies.\n📺 https://youtu.be/XfA8VZck5S0\n\nArtur: The community`s solutions helped me a lot in increasing my sales and interacting with my customers automatically. The support is incredible.\n📺 https://youtu.be/4M-P3gn9iqU\n\nSamuel: The ZDG Community has a lot of cool content that you can use in your day-to-day professional life. After learning the method, I never had any blockages again.");
  }

  else if (msg.body !== null && msg.body === "16") {
    msg.reply("😁 Hola, ¿cómo estás? ¿Cómo te va? Esta es una atención automática y no es supervisada por un humano. Si desea hablar con un representante, elija la opción 4.\r\n\r\nElija una de las opciones a continuación para comenzar nuestra conversación:\r\n\r\n*[ 17 ]* - Quiero asegurar mi lugar en la Comunidad ZDG.\r\n*[ 18 ]* - ¿Qué recibiré al unirme al grupo ZDG?\r\n*[ 19 ]* - ¿Qué tecnologías y herramientas aprenderé en la Comunidad ZDG?\r\n*[ 20 ]* - Me gustaría hablar con Pedrinho, pero gracias por intentar ayudarme.\r\n*[ 21 ]* - Quiero aprender cómo crear mi API GRATIS.\r\n*[ 22 ]* - Quiero conocer el programa completo de la Comunidad ZDG.\r\n*[ 23 ]* - Me gustaría conocer algunos casos de estudio.\r\n*[ 0 ]* - Em *PORTUGUÊS*, por favor!\r\n*[ 8 ]* - In English, please!");
  }
  
  else if (msg.body !== null && msg.body === "17") {
    msg.reply("En la *Comunidad ZDG*, podrás integrar APIs, automatizar con chatbots y sistemas de atención multiusuario para WhatsApp. Con *scripts para copiar y pegar y soporte diario en el grupo de estudiantes*.\n\nhttps://comunidadezdg.com.br/\n\n*⏱️ Las inscripciones están ABIERTAS*\n\nMira el video a continuación y comprende por qué tanta gente común está ahorrando tiempo y ganando dinero explorando la API de WPP, incluso sin saber nada de programación.\n\n📺 https://www.youtube.com/watch?v=AoRhC_X6p5w");
  } 
  
  else if (msg.body !== null && msg.body === "18") {
    msg.reply("En la Comunidad ZDG, vas a poder:\n\n- Utilizar códigos ya probados para automatizar tu atención con chatbots en WhatsApp.\nCrear aplicaciones para la gestión de CRM y plataformas multiusuario para chats de atención.\nAprender integraciones con herramientas y APIs que han sido probadas y aprobadas por la comunidad.\nCuración de plugins y herramientas gratuitas para impulsar el marketing de conversación en tu negocio.\nConectarte con más de 2.000 estudiantes que también están estudiando e implementando soluciones de marketing de conversación.\nGrupo de estudiantes organizado por temas.\nTener acceso a mi soporte personal todos los días.");
  }
  
  else if (msg.body !== null && msg.body === "19") {
    msg.reply("*" + nomeContato + "*, " + "* estas son las principales APIs que ZDG te enseñará a usar con WhatsApp:*\nBaileys, Venom-BOT, WPPConnect, WPPWeb-JS y Cloud API (API Oficial)\n\n*Estas son las principales integraciones que ZDG te enseñará a hacer con WhatsApp:*\nBubble, WordPress (WooCommerce y Elementor), Botpress, N8N, DialogFlow, ChatWoot y plataformas como Hotmart, Edduz, Monetizze, Rd Station, Mautic, Google Sheets, Active Campaign, entre otras.");
  }
  
  else if (msg.body !== null && msg.body === "20") {
        const contact = await msg.getContact();
        setTimeout(function() {
            msg.reply(`@${contact.number}` + ' su contacto ya ha sido reenviado a Pedrinho');  
            client.sendMessage('5515998566622@c.us','Contato ZDG - ES. https://wa.me/' + `${contact.number}`);
	    //client.sendMessage('5515998566622@c.us',`${contact.number}`);
          },1000 + Math.floor(Math.random() * 1000));
  }
  
  else if (msg.body !== null && msg.body === "20") {
    msg.reply("Su contacto ya ha sido reenviado a Pedrinho");
  }
  
  else if (msg.body !== null && msg.body === "21") {
    msg.reply("Disfruta del contenido y aprende en unos minutos cómo poner en línea tu API de WPP, gratis:\r\n\r\n🎥 https://youtu.be/sF9uJqVfWpg");
  }

  else if (msg.body !== null && msg.body === "23") {
    msg.reply(", genial, te enviaré algunos casos de éxito:\n\n📺 https://youtu.be/KHGchIAZ5i0\nGustavo: La estrategia más económica, eficiente y completamente escalable.\n\n📺 https://youtu.be/S4Cwrnn_Llk\nNatália: Aumentamos nuestros ingresos y vendemos a más clientes con la estrategia ZDG.\n\n📺 https://youtu.be/XP2ns7TOdIQ\nYuri: La herramienta me ha ayudado mucho con las automatizaciones de mi tienda en línea.\n\n📺 https://youtu.be/KBedG3TcBRw\nFrancisco: Pedrinho nos guía. Si yo pude lograrlo, tú también puedes.\n\n📺 https://youtu.be/L7dEoEwqv-0\nBruno: La Comunidad ZDG y el soporte de Pedrinho son increíbles. Después de adquirir el curso, dejé de gastar R$300,00 al mes en otras automatizaciones.\n\n📺 https://youtu.be/StRiSLS5ckg\nRodrigo: Soy desarrollador de sistemas y he estado utilizando las soluciones de Pedrinho para integrarlas en mis sistemas, y el ahorro de tiempo es excepcional.\n\n📺 https://youtu.be/sAJUDsUHZOw\nDarley: La Comunidad ZDG ha democratizado el uso de las APIs de WPP.\n\n📺 https://youtu.be/S4Cwrnn_Llk\nNatália: Aumentamos nuestros ingresos y vendemos a más clientes con la estrategia ZDG.\n\n📺 https://youtu.be/crO8iS4R-UU\nAndré: Pedrinho comparte mucha información en la Comunidad ZDG.\n\n📺 https://youtu.be/LDHFX32AuN0\nEdson: El retorno que obtengo en mi trabajo con la información de Pedrinho ha hecho que mi inversión sea gratuita.\n\n📺 https://youtu.be/F3YahjtE7q8\nDaniel: Contenido de gran calidad. Gracias, profesor Pedrinho.\n\n📺 https://youtu.be/YtRpGgZKjWI\nMarcelo: Tengo una agencia digital y con el curso de Pedrinho creamos un nuevo producto y ya lo estamos vendiendo.\n\n📺 https://youtu.be/0DlOJCg_Eso\nKleber: Pedrinho tiene una excelente didáctica y con su curso logré que mi API funcione las 24 horas y estoy generando ventas todos los días.\n\n📺 https://youtu.be/rsbUJrPqJeA\nMárcio: Antes de adquirirlo, tenía poco conocimiento, pero aprendí mucho sobre API con Pedrinho y la comunidad.\n\n📺 https://youtu.be/YvlNd-dM9oo\nZé: Pedrinho tiene un contenido liberador. Fue la mejor inversión que hice. Contenido surrealista.\n\n📺 https://www.youtube.com/watch?v=mHqEQp94CiE\nLéo: Hemos acoplado el Método ZDG a nuestros lanzamientos y hemos optimizado nuestros resultados.\n\n📺 https://youtu.be/pu6PpNRJyoM\nRenato: ZDG es un método que te permitirá aumentar tus ingresos en al menos un 30%.\n\n📺 https://www.youtube.com/watch?v=08wzrPorZcI\nGabi: Implementé la estrategia sin saber nada de programación.\n\n📺 https://youtu.be/10cR-c5rOKE\nDouglas: Después de implementar las soluciones de Pedrinho, aumenté mis ingresos en un 30%, sin mencionar que en la comunidad ZDG todos se ayudan mutuamente.\n\n📺 https://youtu.be/kFPhpl5uyyU\nDanielle: Sin lugar a dudas, conocer a Pedrinho y su contenido fue lo mejor que me pasó.\n\n📺 https://youtu.be/3TCPRstg5M0\nCalebe: El sistema Zap das Galáxias fue fundamental en el desarrollo y ejecución de las estrategias de mi negocio.\n\n📺 https://youtu.be/XfA8VZck5S0\nArtur: Las soluciones de la comunidad me han ayudado mucho a aumentar mis ventas y a interactuar automáticamente con mis clientes. El soporte es increíble.\n\n📺 https://youtu.be/4M-P3gn9iqU\nSamuel: La Comunidad ZDG tiene mucho contenido interesante que se puede utilizar en el día a día y en el ámbito profesional. Después de aprender el método, nunca más tuve bloqueos.");
  }

  else if (msg.body !== null && msg.body === "5"){
    const indice = MessageMedia.fromFilePath('./indice.pdf');
    client.sendMessage(msg.from, indice, {caption: 'Manual revendedor'});
    delay(4500).then(async function() {
      msg.reply("Se você está interessado em se tornar um revendedor dos nossos produtos, temos ótimas oportunidades para você. \n\n Compartilhe um pouco mais sobre suas intenções e negócios, e teremos o prazer de orientá-lo sobre como se tornar um revendedor.")});
	  
  }
	else if (msg.body !== null && msg.body === "14"){
    const indic = MessageMedia.fromFilePath('./indice.pdf');
    client.sendMessage(msg.from, indic, {caption: 'Comunidade ZDG 2.0'});
    delay(4500).then(async function() {
		  msg.reply("")});
	}
    else if (msg.body !== null && msg.body === "22"){
    const index = MessageMedia.fromFilePath('./indice.pdf');
    client.sendMessage(msg.from, index, {caption: 'Comunidade ZDG 2.0'});
    delay(4500).then(async function() {
		  msg.reply("👨‍🏫 INFORMACIÓN BÁSICA SOBRE APIs\r\n👨‍🏫 INFORMACIÓN BÁSICA SOBRE APIs\r\n\r\n🚀 MÓDULO #00 - ZDG APLICADO A LANZAMIENTOS\r\n👨‍🏫 GRUPO DE ALUMNOS EN TELEGRAM\r\ n🎁 MENTORÍA INDIVIDUAL - ESPERANDO EL LANZAMIENTO DE TU HORARIO\r\n🚀 0.0 - ZDG aplicado a tu lanzamiento\r\n🚀 0.1 - Instalando tu API en Contabo\r\n🚀 0.1b - Haciendo múltiples servicios de tu API disponible en Contabo\r\n🚀 0.2 - Instalación de BOT Group Manager\r\n🚀 0.3a - Instalación de Multi-Trigger\r\n🚀 0.3b - Instalación de Recorded Audio Trigger\r\n🚀 0.4 - Notificación automática para su lanzamiento (WebHooks)\r\n🚀 0.5 - 📌 Actualización el 21/10/21 - DESCARGAR ZDG TRIGGER y Extractor de contactos\r\n🚀 0.6 - BOT Group Manager + Telegram\r\n 🚀 0.7 - 📌 Actualización de seguridad 13/09/2021 - Group Manager BOT\r\n🚀 0.8 - Plantilla de mensaje único para lanzamientos\r\n\r\n🚀 MÓDULO n.° 01 - INTRODUCCIÓN A ZDG\r\n ⚠️ Lea atentamente estas instrucciones antes de comenzar tus estudios\r\n🚀 1.0 - ¿Quién soy? ¿Qué pasa con LGPD?\r\n🚀 1.1 - Introducción a ZDG\r\n\r\n🚀 MÓDULO #02 - DEFINE EL OPERADOR Y LA APLICACIÓN ADECUADOS\r\n🚀 2.0 - Elección del operador\r\n🚀 2.1 - El aplicación WPP indicada\r\n\r\n🚀 MÓDULO #03 - EL FORMATO DE LA LISTA DE CLIENTES\r\n🚀 3.0 - Elaboración de la lista de leads (clientes)\r\n🚀 3.1 - Sincronización de Blue con Google Contacts\r\ n\r\n🚀 MÓDULO #04 - SOFTWARE, EXTENSIONES Y CHIPS\r\n🚀 4.0 - Software y extensiones\r\n🚀 4.1 - Conceptos básicos de BAN y estructuras de activación complejas\r\ n🚀 4.2 - Chip de activación vs Asistencia chip\r\n\r\n🚀 MÓDULO #05 - PRÁCTICA DE TIRO\r\n🚀 5.0 - Práctica de tiro\r\n🚀 5.1 - Práctica de tiro\r\ n🚀 5.2 - Práctica de tiro\r\ n🚀 5.3 - Práctica de tiro\r\n🚀 5.4 - Práctica de tiro\r\n🚀 5.5 - Práctica de tiro\r\n🚀 5.6 - Práctica de tiro\r\n🚀 5.7 - Práctica de tiro\r\n🚀 5.8 - Práctica de tiro\r\n🚀 5.9 - La teoría de los bloques\r\ n🚀 6.0 - Mensaje inicial\r\n🚀 7.0 - Procesamiento de datos en excel\r\n🚀 8.0 - Generando ingresos extra con ZDG\r\n🚀 9.0 - Chip Calculator\r\n🚀 10.0 - Acelera tu proceso\ r\n🚀 11.0 - Cómo formatear el contenido ideal para Zap\r\n🚀 12.0 - Manual de tiro de campaña\r\n🚀 13.0 - Manual anti-SPAM\r\n🚀 14.0 - Comprender el cifrado y el algoritmo de WPP\r\ n🚀 15.0 - Hoja de cálculo con el calendario de envío activador\r\n\r\n🛸 GRUPOS DE BONIFICACIÓN\r\n🛸 16.0 - Clientes ocultos y números virtuales\r\n🛸 17.0 - GRUPOS WPP - ¡REDIRECCIÓN AUTOMÁTICA GRATUITA!\r\ n🛸 17.1 - GRUPOS de WPP - Aprende a exportar todos los contactos de tus grupos de WPP a una hoja de cálculo en Excel\r\n🛸 17.2 - GRUPOS de WPP - Aprende a extraer la información del GRUPO con solicitudes POST\r\n\r\n 🤖 CHATBOT ADICIONAL\r\n🤖 18.0 - Administrador de grupo BOT\r \n🤖 19.0 - Red de robots para envío de mensajes y archivos a través de la API de WPP\r\n🤖 20.0 - CHATBOT con preguntas y respuestas nativas en JS\r\n🤖 20.1 - CHATBOT dinámico accediendo a la base de datos en tiempo real\r\ n🤖 20.2 - CHATBOT dinámico + CHROME\r\n🤖 21.1 - Chatbot + DialogFlow (Instalación hasta configurar respuestas de texto)\r\n🤖 21.2 - Chatbot + DialogFlow (Respondiendo a intentos de texto y audio a través de WPP)\r\n🤖 22.0 - Pronóstico del tiempo con DialogFlow\r\n🤖 23.0 - JUEGO para WPP\r\n🤖 24.0 - Múltiples asistentes - 1 número, múltiples usuarios\r\n🤖 24.1 - Múltiples asistentes - 1 número, múltiples usuarios WINDOWS\r\ nº 24.2- Múltiples asistentes - 1 número, múltiples usuarios CONTABO\r\n🤖 24.3 - Múltiples asistentes - 1 número, múltiples usuarios + Disparador automático\r\n🤖 24.4 - Múltiples asistentes - 1 número, múltiples usuarios + Grupos + DialogFlow\r\ n🤖 24.5 - Múltiples asistentes - 1 número, múltiples usuarios + Historial\r\n🤖 24.6 - Múltiples asistentes - 1 número, múltiples usuarios + SUB y FTP\r\n🤖 24.7 - Múltiples asistentes - 1 número, múltiples usuarios + Personalización de Front AWS\r\n🤖 24.8 - Múltiples asistentes - 1 número, múltiples usuarios + Front CONTABO Personalización\r\n🤖 24.9 - Múltiples asistentes - 1 número, múltiples usuarios + MD\r\n🤖 24.10 - Múltiples asistentes - 1 número, múltiples usuarios + SMS + Llamada telefónica\r\n🤖 24.11 - Múltiples asistentes - 1 número, múltiples usuarios + Múltiples instancias en el mismo VPS\r\n🤖 24.12 - Múltiples asistentes - 1 número, múltiples usuarios + Múltiples instancias de Localhost \r\n🤖 24.13 - Múltiples asistentes - 1 número, múltiples usuarios + Directo + Grabación multimedia\r\n🤖 24.1 4 - Múltiples asistentes - 1 número, múltiples usuarios + REPO OFICIAL EN GITHUB\r\n🤖 24.15 - Múltiples asistentes - 1 número, múltiples usuarios + API externa\r\n🤖 25.0 - Conexión de su BOT en la nube en un VPS ( Servidor Privado Virtual)\r\n🤖 26.0 - Creación de su ISCA BOT + Manual en PDF\r\n🤖 26.1 - Introducción a SKEdit\r\n🤖 26.2 - Captura automática de prospectos\r\n🤖 27.0 - Chatbot para Instagram y DialogFlow\r\n🤖 27.1 - Chatbot para Instagram con WPP\r\n🤖 28.0 - Robot gratuito para activación de mensajes y captura de datos con WPP API - WPPConnect POSTGRE\r\n🤖 28.1 - Mensaje gratuito robot de activación y captura de datos con API de WPP - WPPConnect MYSQL\r\n🤖 28.2 - Aprende a integrar WPPConnect API de WPP con DialogFlow\r\n🤖 29.0 - Aprende a integrar Venom -BOT con DialogFlow y explora esta API gratuita de WPP\ r\n🤖 29.1 - API REST para enviar Listas y Botones en WPP usando VENOM-BOT\r\n🤖 29.2 - Robot para activación de mensajes y captura de datos con la API de WPP - Venom-BOT MongoDB\r\n🤖 29.3 - Mensaje activación y captura de datos del robot con la API de WPP - Venom-BOT MYSQL\r\n🤖 29.4 - Activación de mensajes y captura de datos del robot con la API de WPP - Venom-BOT POSTGRE\r\n🤖 29.5 - Exportación de Venom-BOT QRCode y consumo de la API de WPP \r\n🤖 29.6 - Crear y administrar múltiples ins Instancias de API de WPP gratis usando Venom-BOT\r\n🤖 29.7 - Aprende a integrar Venom-BOT con DialogFlow y explora listas y botones con WPP API\r\n🤖 29.8 - Robot gratuito para disparar listas y botones gratis con API de WPP - Venom-BOT\r\n🤖 29.9 - ¿Con nueve o sin nueve? Descubre cómo configurar tu API de WPP contra la regla del número fantasma\r\n🤖 29.10 - Robot gratuito para realizar llamadas telefónicas con la API de WPP - Venom-BOT\r\n🤖 29.11 - Robot gratuito para consultar información del mercado de criptomonedas en API de WPP - Venom-BOT\r\n🤖 29.12 - Aprende a validar contactos de WPP de forma masiva con WPP API Venom-BOT\r\n🤖 29.13 - Aprende a crear un CRUD para manipular MYSQL y consumir a través de Venom-BOT\r \n\r\n👨‍💻 NOTIFICACIONES AUTOMÁTICAS ADICIONALES\r\n👨‍💻30.0 - Creación de su EMBUDO DE VENTAS y BOT usando PHP + ChatAPI\r\n👨‍💻 30.1 - API de WPP gratis + Carga de medios + Carga de texto a grupos + WEBHOOK a HOTMART\r\n👨‍ 💻 31.0 - Gratis notificación a través de la API de WPP para clientes potenciales\r\n👨‍💻 31.1 - Crear botones y listas con la API de WPP\r\n👨‍💻 31.2 - Aprende a enviar archivos multimedia y administrar grupos a través de la API de WPP\r\n👨‍💻 32.0 - Cómo mantener activa la API sin desconexiones usando la cuenta gratuita de Heroku\r\n👨‍💻 33.0 - API de WPP GRATIS y WooCommerce\r\n👨‍💻 33.1 - API de WPP GRATIS e IMÁGENES de WooCommerce\r\n👨‍💻 33.2 - Envía listas y botones gratis usando WPP y WooCommerce API\r\n👨‍💻 34.0 - Múltiples instancias\r\n👨‍💻 35.0 - Instalar API dentro de un VPS \r\n👨‍💻 36.0 - CHAT API + Elementor \r\n👨‍💻 37.0 - CHAT-API + Hotmart + Eduzz + Monetizze\r\n👨‍💻 38.0 - Notifica a tu cliente potencial capturado en Elementor PRO o HTML FORM a través de WPP con API gratuita\r\n👨‍💻 38.1 - Envía listas y botones gratis usando API y Elementor\r\n👨‍💻 39.0 - Notificación automática en Bubble a través de la API de WPP\r\n👨‍💻 40.0 - Envío de archivos en Bubble a través de la API de WPP\r\n👨‍💻 40.1 - Aprenda a incrustar la API de WPP con tu aplicación Bubble\r\n👨‍💻 41.0 - Envío de archivos en Bubble a través de la API de Instagram\r\n👨‍💻 42.0 - Notificación automática gratuita con WPP API para clientes de RD Station y Active Campaign (CRM)\r\n👨‍ 💻 43.0 - Bot de activación de mensajes y captura de datos con la API de WPP y Google Sheets (Sheet)\r\n👨‍💻 44.0 - Introducción a Venom-BOT\ r\n👨‍💻 45.0 - Cómo exportar todas las conversaciones de WPP en un archivo JSON usando la API de WPP\r\n👨‍💻 46.0 - Juego JOKENPO para WPP\r\n👨‍💻 46.1 - Consumir la API ClickUp directamente en WPP\r\n👨‍💻 46.2 - Consumir la API de Twitter a través de WPP\r\n 👨‍💻 47.0 - Aprende a programar mensajes automáticos usando la API de WPP\r\n👨‍💻 48.0 - API REST gratuita para enviar listas y botones en WPP\r\n👨‍💻 49.0 - Baileys, una API liviana, rápida y súper estable + DialogFlow\r\n👨‍💻 49.1 - Baileys, una API liviana, rápida y súper estable + MD\r\n👨‍💻 49.2 - Baileys, una API liviana, rápida y súper estable + MD\r\n👨‍💻 49.3 - Aprende a instalar Baileys WPP API directamente en tu Android (Termux), sin VPS ni PC\r\n👨‍💻 49.4 - Aprende a crear un robot de disparo automático con Baileys\r\n👨‍💻 49.5 - Explora las solicitudes de publicación con BAILEYS REST API\r\n👨‍💻 49.6 - Aprende a crear Frontend para consumir Baileys QRCode\r\n👨‍💻 49.7 - Consumir datos de la base de datos MYSQL a través de Baileys\r\n👨‍💻 50.0 - Aprende a usar la API de WPP de forma gratuita con la nueva versión multidispositivo (BETA - MD)\ r\n👨‍💻 51.0 - Aprenda a crear chatbots modernos con Botpress y la API de WPP de forma gratuita\r\n👨‍💻 51.1 - Aprenda a instalar Botpress directamente en su VPS y exponga el servicio en un subdominio\r\ n👨‍💻 52.0 - Aprende a enviar SMS a través de API de WPP gratis y Vonage\r\n👨‍💻 53.0 - Controla la API de WPP con la punta de tus dedos usando la biblioteca FINGERPOSE\r\n\r\n📰 BONUS WORDPRESS\r\n📰 61.0 - Introducción\r\n📰 62.0 - Registro de Dominio\r\n📰 63,0 - Contratación del servidor adecuado con menos de R$ 15,00/Mes\r\n📰 64,0 - Apuntando DNS - Parte 1\r\n📰 64,1 - Habilitación del certificado SSL gratuito - Parte 2\r\ n📰 65.0 - Instalación y configuración de Wordpress - Parte 1\r\n📰 65.1 - Instalación y configuración de Wordpress - Parte 2\r\n📰 66.1 - Optimización e importación de la plantilla en Wordpress - Parte 1\r \n📰 66.2 - Optimización e importación de la plantilla en Wordpress - Parte 2\r\n📰 66.3- Optimización e importación de la plantilla en Wordpress - Parte 3\r\n📰 67.0 - Habilitación de su correo electrónico profesional\r\n \r\n🛸 ZDG \r\n🛸 EN VIVO n.° 01: viaje de lanzamiento con WPP\r\n🛸 EN VIVO n.° 02: viaje de lanzamiento con WPP\r\n🛸 EN VIVO n.° 03: viaje de lanzamiento con WPP\r\n🛸 EN VIVO n.º 04: viaje de lanzamiento con WPP\r\n🛸 LIVE #05 - Launch Journey con WPP\r\n🛸 Shooting Blog - Lanzamiento de producto digital con el método ZDG\r \n🛸 Shooting Blog - Los mimados de 2.0");
    });
	}
	 else if (msg.body !== null || msg.body === "0" || msg.type === 'ptt' || msg.hasMedia) {
    msg.reply("🤖 Olá! Seja muito bem-vindo à Essenciais Express!\r\n\r\n🌐 Conheça nossos produtos incríveis em: [https://www.essenciaisexpress.shop/] \r\n\r\n⏰ Nosso horário de atendimento é das *09:00 às 18:00*, de segunda a sexta-feira. \r\n\r\n 📞 Se você tiver alguma dúvida, não hesite em nos contatar. Estamos aqui para ajudar!\r\n\r\n Atenciosamente, Equipe Essenciais Express");
    const foto = MessageMedia.fromFilePath('./foto.png');
    client.sendMessage(msg.from, foto)
    delay(3000).then(async function() {
      try{
        const media = MessageMedia.fromFilePath('./comunidade.ogg');
        client.sendMessage(msg.from, media, {sendAudioAsVoice: true})
        //msg.reply(media, {sendAudioAsVoice: true});
      } catch(e){
        console.log('audio off')
      }
		});
    delay(8000).then(async function() {
      const saudacaoes = ['Olá ' + nomeContato + ', tudo bem?', 'Oi ' + nomeContato + ', como vai você?', 'Opa ' + nomeContato + ', tudo certo?'];
      const saudacao = saudacaoes[Math.floor(Math.random() * saudacaoes.length)];
      msg.reply(saudacao + " Esse é um atendimento automático, e não é monitorado por um humano. Caso queira falar com um atendente, escolha a opção *[4]*. \r\n\r\nEscolha uma das opções abaixo para iniciarmos a nossa conversa: \r\n\r\n*[ 1 ]* - Gostaria de informações sobre Atacado \r\n*[ 2 ]* - Politicas de troca \r\n*[ 3 ]*- Promoções \r\n*[ 4 ]* - Atendimento humano \r\n*[ 5 ]*- Revenda \r\n*[ 6 ]*- Formas de pagamento \r\n*[ 7 ]*-  FAQ  \r\n*[ 8 ]*- In *ENGLISH* please! \r\n*[ 16 ]*- En *ESPAÑOL* por favor.");
		});
    
	}
});

console.log("\n Bona-Bot, execução direta.")
console.log("\nSuporte via (47)9 9702-0079\n")
    
server.listen(port, function() {
        console.log('Aplicação rodando na porta *: ' + port + ' . Acesse no link: http://localhost:' + port);
});
