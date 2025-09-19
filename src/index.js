import { spawn } from 'child_process';
import NodeMediaServer from 'node-media-server';

const VIRTUAL_DISPLAY = ':1';
const RESOLUTION = '1280x720';

// --- Lista de Processos para Gerenciar ---
const processes = [];

// --- Função Principal ---
async function main() {
    console.log('🚀 Iniciando o ambiente completo...');

    try {
        // --- PASSO 1: Iniciar o Ambiente Gráfico Virtual ---
        console.log('[1/4] Iniciando o servidor virtual Xvfb...');
        const xvfb = spawn('Xvfb', [VIRTUAL_DISPLAY, '-screen', '0', `${RESOLUTION}x24`, '-ac']);
        processes.push(xvfb);
        // Redireciona a saída de erro do Xvfb para o console principal para debugging
        xvfb.stderr.on('data', data => console.error(`[Xvfb STDERR]: ${data}`));
        await new Promise(resolve => setTimeout(resolve, 2000)); // Espera para garantir que o Xvfb iniciou

        // --- PASSO 2: Iniciar a Aplicação de Teste (o "Jogo") ---
        console.log('[2/4] Iniciando a aplicação de teste (glxgears)...');
        const game = spawn('glxgears', { env: { ...process.env, DISPLAY: VIRTUAL_DISPLAY } });
        processes.push(game);

        // --- PASSO 3: Iniciar o Servidor de Mídia ---
        console.log('[3/4] Iniciando o Servidor de Mídia (Node-Media-Server)...');
        const nms = new NodeMediaServer({
            rtmp: { port: 1935, chunk_size: 60000 },
            http: { port: 8000, allow_origin: '*' }
        });
        nms.run();

        // --- PASSO 4: Iniciar o FFmpeg para Fazer o Streaming ---
        // Espera um pouco mais para garantir que o servidor de mídia esteja pronto
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('[4/4] Iniciando o FFmpeg para capturar e enviar o stream...');
        const ffmpeg_args = [
            '-f', 'x11grab',
            '-r', '30', // FPS
            '-s', RESOLUTION,
            '-i', VIRTUAL_DISPLAY,
            '-c:v', 'h264_nvenc', // USE O ENCODER DA SUA PLACA!
            '-preset', 'p1', 
            '-b:v', '2.5M',
            '-maxrate', '2.5M',
            '-bufsize', '5M',
            '-g', '60', // Keyframe a cada 2 segundos
            '-f', 'flv',
            'rtmp://localhost/live/stream' // Envia para o nosso servidor de mídia
        ];
        const ffmpeg = spawn('ffmpeg', ffmpeg_args);
        processes.push(ffmpeg);
        // Mostra a saída do ffmpeg para vermos o progresso e os erros
        ffmpeg.stderr.on('data', data => console.log(`[FFmpeg]: ${data}`));

        console.log('\n\n✅ Ambiente pronto! O streaming foi iniciado.');
        console.log('Abra o arquivo index.html no seu navegador para ver o vídeo.');
        console.log('Pressione Ctrl+C neste terminal para encerrar tudo.');

    } catch (error) {
        console.error('🔥🔥🔥 Ocorreu um erro ao iniciar o ambiente! 🔥🔥🔥', error);
        shutdown(); // Garante que tudo seja encerrado em caso de erro
    }
}

// --- Função de Encerramento ---
function shutdown() {
    console.log('\n🧹 Encerrando todos os processos...');
    // Encerra os processos na ordem inversa
    [...processes].reverse().forEach(proc => {
        if (proc && !proc.killed) {
            proc.kill('SIGINT');
        }
    });
    // Dá um tempo para os processos encerrarem antes de sair
    setTimeout(() => process.exit(0), 1000);
}

// Captura o comando de encerrar (Ctrl+C) para chamar nossa função de limpeza
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// --- Inicia a Execução ---
main();