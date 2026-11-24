export const STRINGS = {
  appName: 'Servidor Proxy PS3 para Android',
  status: 'Status: ',
  statusOn: 'LIGADO',
  statusOff: 'DESLIGADO',
  notAvailable: 'N/D',
  enterPort: 'Digite a porta escolhida...',
  enterIp: 'Digite o IP escolhido...',
  port: 'Porta: ',
  credits: 'Créditos',
  creditsMenu: 'Créditos, AVISO, bugs e ideias',
  credits1: '- Edw590 (GitHub) - pela criação do aplicativo;',
  credits2:
    '- blckbear_ (PSX-Place) - por ajudar, testar e dar ideias (muitos créditos para ele);',
  credits3:
    '- mondul (GitHub/PSX-Place) - por criar o programa que está por trás do aplicativo (créditos incríveis para ele, pois sem isso o aplicativo não seria possível com tanta facilidade);',
  credits4:
    'O programa original usado no aplicativo (agora bastante modificado) pode ser encontrado no GitHub: https://github.com/mondul/PS3-Proxy.',
  credits5: 'AVISO',
  credits6:
    'O aplicativo original foi feito para Android 4.0.3 ou superior e adaptado para execução completa via navegador.',
  credits7:
    'Caso precise configurar o servidor proxy manualmente em dispositivos Android antigos (Android 2.2 a 4.0), siga este tutorial feito por quem colaborou neste aplicativo:',
  credits8:
    'https://www.psx-place.com/threads/tutorial-how-to-set-up-ps3-proxy-server-on-android.22846/',
  credits9: 'Bugs e ideias',
  credits10:
    'Se você encontrou algum problema no aplicativo ou tem alguma sugestão em mente (ou apenas quer conferir novidades), comente neste tópico oficial:',
  credits11: 'https://www.psx-place.com/resources/ps3-proxy-server-for-android.795/',
  settings: 'Configurações',
  autoStart: 'Iniciar o servidor automaticamente ao ligar o dispositivo',
  autoSavePort: 'Salvar automaticamente a porta escolhida',
  autoSaveIp: 'Salvar automaticamente o IP escolhido',
  visitWebsite: 'Visitar site',
  invalidPort:
    'ERRO: Por favor, insira uma porta entre 1024 e 65535 (a porta padrão é 8080).',
  chooseFile: 'Escolher arquivo',
  autoGenerateFile: 'Escrever manualmente o arquivo ps3-updatelist.txt',
  updateIp: 'Atualizar IP',
  chosenFile: 'Caminho do arquivo escolhido: ',
  newUpdate: 'Nova versão do aplicativo disponível!',
  changelog: 'Registro de alterações',
  pleaseWaitChangelog: 'Por favor, aguarde... O registro de alterações está sendo processado.',
  downloadInstallUpdate: 'Baixar e instalar',
  ignoreADay: 'Ignorar por um dia',
  disableAutoUpdater: 'Desativar o notificador de atualizações (não recomendado)',
  checkUpdatesManually: 'Verificar atualizações manualmente',
  updateNotFound: 'Nenhuma atualização disponível',
  updateNotFoundError: 'Erro ao procurar atualizações',
  instructions: 'Instruções',
  instructionsOnPs3: 'No PS3:',
  instructions01:
    "''No seu PS3, vá em Configurações ➡ Configurações de Rede ➡ Configurações de Conexão à Internet, pressione ✖ para continuar, selecione o método Personalizado e avance até a tela Servidor Proxy. Escolha Usar, continue, digite o endereço IP exibido no aplicativo e avance até a tela de salvar configurações. Pressione ✖ para salvar e pressione novamente se quiser testar a conexão. Agora você poderá se conectar à PSN.'' (da página do PS3-Proxy de mondul no GitHub, adaptado)",
  instructionsOnApp: 'No aplicativo:',
  instructions02: 'Explicações sobre alguns recursos do aplicativo:',
  instructions03:
    '- Desativar o notificador de atualizações (não recomendado, pois você perderá possíveis atualizações, a menos que verifique manualmente de tempos em tempos).',
  instructions04:
    '- Escrever manualmente o arquivo ps3-updatelist.txt, caso por algum motivo o automático não funcione para você (avise se não funcionar, pode ser alguma região específica — ou apenas escreva seu próprio arquivo);',
  instructions05:
    '- O IP é detectado automaticamente ao iniciar o aplicativo. Se o servidor estiver em execução e o IP mudar (por exemplo, ao trocar de rede), basta clicar em Atualizar IP para reiniciar o servidor com o novo endereço. Se o IP não tiver mudado, nada acontecerá.',
  instructions06:
    "- Sobre o redirecionamento de imagens: tudo começou com a ideia de redirecionar o XML de 'Novidades' para as notícias do PSX-Place como o DeViL303 fez no CFW — obrigado ao DeViL por permitir usar o XML. Como o XML original usa HTTPS, apenas as imagens são redirecionadas. ATENÇÃO: se você ativar o redirecionamento de 'Novidades' e do ícone da PS Store ao mesmo tempo, a URL de 'Novidades' será usada para ambos. Você também pode redirecionar para feeds RSS (como feeds de canais do YouTube ou sites) que contenham imagens.",
  instructions07:
    '- As regras personalizadas de redirecionamento de URL funcionam apenas para URLs HTTP. Conexões HTTPS são criptografadas e encaminhadas via túnel.',
  instructions08:
    '- O verificador de logs é manual: clique em Verificar logs para buscar os registros mais recentes do servidor proxy. Você também pode salvar os logs em um arquivo HTML (PPSFA_Logfile.html) pelo menu superior direito.',
  instructions09:
    '- Quando houver uma nova atualização, o notificador avisará ao abrir o aplicativo. Você pode clicar em Ignorar por um dia na parte inferior da tela ou voltar para manter o aviso ativo.',
  instructions10:
    '- Todo o aplicativo foi traduzido para Português do Brasil, incluindo os menus de proxy, regras, logs, conta e gerenciamento de assinaturas.',
  howToUse: 'Como usar',
  errorIp: 'Provavelmente o endereço IP informado não está correto',
  officialPs3Updatelist: 'Usar arquivo ps3-updatelist.txt oficial',
  realtimeLogs: 'Logs em tempo real',
  rules: 'Regras',
  whatsNewPsxPlaceNews:
    "Redirecionar imagens de 'Novidades' para as imagens de notícias do PSX-Place",
  psStorePsxPlaceNews:
    'Redirecionar imagens do ícone da PS Store para as imagens de notícias do PSX-Place',
  tvVideoServicesPsxPlaceNews:
    'Redirecionar imagens de Serviços de TV/Vídeo para as imagens de notícias do PSX-Place',
  whatsNewRssFeed:
    "Redirecionar imagens de 'Novidades' para todas as imagens de um feed RSS",
  psStoreRssFeed:
    'Redirecionar imagens da PS Store para todas as imagens de um feed RSS',
  tvVideoServicesRssFeed:
    'Redirecionar imagens de Serviços de TV/Vídeo para todas as imagens de um feed RSS',
  whatsNewRssFeedUrl: 'URL do feed RSS de Novidades',
  psStoreRssFeedUrl: 'URL do feed RSS do ícone da PS Store',
  tvVideoServicesRssFeedUrl: 'URL do feed RSS de Serviços de TV/Vídeo',
  customRules:
    "Abaixo, insira regras personalizadas para o servidor. Para redirecionar uma URL para um arquivo, use o formato: URL --> Caminho_do_arquivo. Cada regra deve ficar em uma única linha. Para adicionar mais regras, pressione ENTER e adicione outra linha. Insira a URL exata desejada e clique em Escolher arquivo para adicionar ' --> /caminho/para/o/arquivo' ao final do campo. Não adicione mais do que os 2 espaços mostrados acima (um antes e outro depois da seta).",
  customRedirectionRules: 'Regras personalizadas de redirecionamento de URL',
  saveLogs: 'Salvar logs em PPSFA_Logsfile.html',
  saveLogsSucceeded: 'Arquivo salvo com sucesso',
  updatePort: 'Atualizar porta',
  seeRequests: 'Exibir URLs HTTP e hosts HTTPS acessados nos logs',
  checkLogs: 'Verificar logs',
} as const;
