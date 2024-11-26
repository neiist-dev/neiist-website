// pages/aoc/page.jsx
'use client';
import { useState } from 'react';
import './styles.css';

export default function AoC() {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText('4234755-033d0796');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="aoc-container">
            <div className="aoc-content">
                <div style={{
                    minWidth: '60em',
                    margin: '40px',
                    background: '#0f0f23',
                    color: '#cccccc',
                    fontFamily: '"Source Code Pro", monospace',
                    fontWeight: 300,
                    fontSize: '14pt'
                }}>
                    <h1 style={{
                        textAlign: 'center',
                        fontSize: '100px',
                        color: '#009900',
                        cursor: 'default',
                        animation: 'blink 2s infinite alternate',
                        textShadow: '0 0 5px #009900'
                    }}>
                        ADVENT OF CODE
                    </h1>

                    <h1 style={{
                        textAlign: 'center',
                        fontSize: '80px',
                        color: '#009900',
                        textShadow: '0 0 5px #009900'
                    }}>
                        <span
                            onClick={() => window.location.href = 'https://neiist.tecnico.ulisboa.pt/'}
                            style={{
                                color: '#2863fd',
                                cursor: 'pointer',
                                transition: 'color 0.3s ease'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#6a9bff'}
                            onMouseOut={(e) => e.target.style.color = '#2863fd'}
                        >
                            NEIIST
                        </span>
                        {' X '}
                        <span
                            onClick={() => window.location.href = 'https://www.cloudflare.com/pt-br/'}
                            style={{
                                color: '#f97316',
                                cursor: 'pointer',
                                transition: 'color 0.3s ease'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#f5a623'}
                            onMouseOut={(e) => e.target.style.color = '#f97316'}
                        >
                            CLOUDFLARE
                        </span>
                    </h1>

                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '50px', color: '#009900', padding: '10px' }}>
                            <span style={{ opacity: 0.33, padding: 0 }}>1.1.1.1:</span>
                            <a href="https://adventofcode.com/2024" style={{ color: '#009900', textDecoration: 'none' }}>2024</a>
                        </h1>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <h4>Código da leaderboard:</h4>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 15px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: copied ? '#4CAF50' : '#2C2C44',
                                transition: 'background-color 0.3s ease'
                            }}
                            onClick={copyToClipboard}
                        >
                            <span style={{ fontSize: '30px' }}>4234755-033d0796</span>
                            <svg style={{ width: '30px', height: '20px' }} viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z" />
                            </svg>
                        </div>
                    </div>

                    <h2 style={{ marginTop: '2em' }}>Como funciona?</h2>
                    <p>
                        O <a href="https://adventofcode.com/" style={{ color: '#009900', textDecoration: 'none' }}>Advent Of Code</a> é um evento que lança desafios diários de programação,
                        desde o dia 1 de dezembro até ao Natal. Estes desafios podem ser resolvidos
                        na linguagem de programação que preferires! Todos os dias às 5h da manhã
                        são lançados 2 problemas, que vão ficando progressivamente mais difíceis.
                    </p>

                    <p>
                        Em cada desafio, os participantes que o resolvem mais rápido recebem um
                        maior número de pontos. Por cada problema resolvido, ganhas uma estrela
                        <span style={{ color: '#ffff66' }}> *</span>. Quem obtiver mais pontos no final do
                        evento, ganha!
                    </p>

                    <p>
                        Este ano, o <em style={{ color: '#2863fd', textShadow: '0 0 5px #2863fd', fontStyle: 'normal' }}>NEIIST</em> juntamente com a <em style={{ color: '#f97316', textShadow: '0 0 5px #f97316', fontStyle: 'normal' }}>CloudFlare</em> decidiu
                        criar uma leaderboard e oferecer prendas de Natal ao pódio!
                        <em style={{ color: 'white', textShadow: '0 0 5px #ffffff', fontStyle: 'normal' }}> [1]</em>
                    </p>

                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ paddingLeft: '2.5em', position: 'relative' }}>
                            <em style={{ color: 'white', textShadow: '0 0 5px #ffffff', fontStyle: 'normal' }}>1º lugar:</em> Entrevista garantida para o estágio de verão da
                            <em style={{ color: '#f97316', textShadow: '0 0 5px #f97316', fontStyle: 'normal' }}> CloudFlare</em>, uma Sweat de EIC do <em style={{ color: '#2863fd', textShadow: '0 0 5px #2863fd', fontStyle: 'normal' }}>NEIIST</em> à
                            escolha de qualquer ano letivo, incluindo o atual e ainda brindes da <em style={{ color: '#f97316', textShadow: '0 0 5px #f97316', fontStyle: 'normal' }}>CloudFlare</em>.
                        </li>
                        <li style={{ paddingLeft: '2.5em', position: 'relative' }}>
                            <em style={{ color: 'white', textShadow: '0 0 5px #ffffff', fontStyle: 'normal' }}>2º lugar:</em> Sweat de EIC à escolha de qualquer ano letivo anterior e brindes da <em style={{ color: '#f97316', textShadow: '0 0 5px #f97316', fontStyle: 'normal' }}>CloudFlare</em>.
                        </li>
                        <li style={{ paddingLeft: '2.5em', position: 'relative' }}>
                            <em style={{ color: 'white', textShadow: '0 0 5px #ffffff', fontStyle: 'normal' }}>3º lugar:</em> Vale de 5€ na compra de uma sweat de EIC e brindes da <em style={{ color: '#f97316', textShadow: '0 0 5px #f97316', fontStyle: 'normal' }}>CloudFlare</em>.
                        </li>
                    </ul>

                    <h2 style={{ marginTop: '2em' }}>Como me posso juntar à leaderboard <em style={{ color: '#2863fd', textShadow: '0 0 5px #2863fd', fontStyle: 'normal' }}>NEIIST</em> <em style={{ color: 'white', textShadow: '0 0 5px #ffffff', fontStyle: 'normal' }}>X</em> <em style={{ color: '#f97316', textShadow: '0 0 5px #f97316', fontStyle: 'normal' }}>CLOUDFLARE</em>?</h2>

                    <p>
                        Para te juntares à leaderboard, tens de fazer
                        <a href="https://adventofcode.com/2024/auth/login" style={{ color: '#009900', textDecoration: 'none' }}> [login]</a> no site
                        do <a href="https://adventofcode.com/" style={{ color: '#009900', textDecoration: 'none' }}>Advent Of Code</a>, por uma das seguintes formas:
                    </p>

                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {['Github', 'Google', 'Twitter', 'Reddit'].map(provider => (
                            <li key={provider} style={{ paddingLeft: '2.5em' }}>- {provider}</li>
                        ))}
                    </ul>

                    <p>
                        Depois de fazeres login, tens de ir a <a href="https://adventofcode.com/2024/leaderboard" style={{ color: '#009900', textDecoration: 'none' }}>[leaderboard]</a>
                        {' > '}<a href="https://adventofcode.com/2024/leaderboard/private" style={{ color: '#009900', textDecoration: 'none' }}>[Private leaderboard]</a>, e coloca o código da
                        leaderboard <em style={{ color: 'white', textShadow: '0 0 5px #ffffff', fontStyle: 'normal' }}>NEIIST X CloudFlare</em> e clicar em <a style={{ color: '#009900', textDecoration: 'none' }}>[Join]</a>!
                    </p>

                    <p>
                        Caso não te consigas juntar à leaderboard, por favor contacta-nos por email
                        <a href="mailto:neiist@tecnico.ulisboa.pt" style={{ color: '#009900', textDecoration: 'none' }}> neiist@tecnico.ulisboa.pt</a> para que possamos ajudar.
                    </p>

                    <p>
                        O <em style={{ color: '#2863fd', textShadow: '0 0 5px #2863fd', fontStyle: 'normal' }}>NEIIST</em> e a <em style={{ color: '#f97316', textShadow: '0 0 5px #f97316', fontStyle: 'normal' }}>CloudFlare</em> desejam-te boa sorte e um feliz Advent Of Code!
                    </p>

                    <p>
                        <em style={{ color: 'white', textShadow: '0 0 5px #ffffff', fontStyle: 'normal' }}>[1]</em> Participação limitada a alunos do Instituto Superior
                        Técnico (a ser verificado aquando da atribuição de prémios).
                        <br />
                        <em style={{ color: 'white', textShadow: '0 0 5px #ffffff', fontStyle: 'normal' }}>[2]</em> Escolha de sweats de anos letivos anteriores está limitada ao stock existente.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img
                            src="https://web.tecnico.ulisboa.pt/~ist199075/static/neiist_logo.png"
                            style={{ width: '10%', height: '10%', margin: '15px' }}
                            alt="NEIIST Logo"
                        />
                        <img
                            src="https://web.tecnico.ulisboa.pt/~ist199075/static/CF_logo_stacked_whitetype.svg"
                            style={{ width: '10%', height: '10%', margin: '15px' }}
                            alt="Cloudflare Logo"
                        />
                    </div>

                    <style jsx>{`
        @keyframes blink {
          0% {
            color: #009900;
            text-shadow: 0 0 5px #009900, 0 0 10px #00cc00, 0 0 15px #00cc00;
          }
          50% {
            color: #009900;
            text-shadow: 0 0 15px #009900;
          }
        }

        a:hover {
          color: #99ff99 !important;
        }
      `}</style>
                </div>
            </div>
        </div>
    );
}