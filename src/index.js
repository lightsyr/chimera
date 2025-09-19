import { spawn } from 'child_process';

// Função principal assíncrona para podermos usar await
async function main() {
    console.log('🚀 Iniciando o servidor Xorg virtual...');
    const xorg = spawn('sudo', ['Xorg', ':1', '-config', '/home/leandro.campos/xorg-dummy.conf']);

    // Mostra a saída do Xorg no nosso console para debugging
    xorg.stdout.pipe(process.stdout);
    xorg.stderr.pipe(process.stderr);

    console.log('Aguardando o servidor Xorg iniciar...');

    console.log('🎮 Iniciando a aplicação de teste (glxgears)...');
    const game = spawn('glxgears', [], {
        env: { ...process.env, 'DISPLAY': ':1' } // Define a variável de ambiente
    });

    game.stdout.pipe(process.stdout);
    game.stderr.pipe(process.stderr);

    console.log('Aguardando a aplicação iniciar...');

    console.log('📸 Tirando screenshot...');
    const screenshot = spawn('xwd', ['-root', '-out', 'screenshot.xwd'], {
        env: { ...process.env, 'DISPLAY': ':1' }
    });

    // Aguarda o processo do screenshot terminar
    await new Promise(resolve => screenshot.on('close', resolve));

    console.log('🖼️ Convertendo screenshot para PNG...');
    const converter = spawn('convert', ['screenshot.xwd', 'screenshot.png']);

    await new Promise(resolve => converter.on('close', resolve));

    console.log('✅ Sucesso! Verifique o arquivo screenshot.png');
    console.log('Encerrando os processos...');

    // Limpeza
    game.kill();
    xorg.kill();
}

// Altere 'seu_usuario' para o seu nome de usuário no Linux!
main().catch(console.error);