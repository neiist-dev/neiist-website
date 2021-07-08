import React from "react";
import Button from "react-bootstrap/Button";

const MajorPage = () => (
  <>
    <div style={{ margin: "10px 20vw" }}>
      <h1 style={{ textAlign: "center" }}>O CURSO</h1>
    </div>
    <div style={{ margin: "10px 20vw" }}>
      <h2 style={{ textAlign: "center" }}>INTRODUÇÃO</h2>
      <p>
        A licenciatura em Engenharia Informática e de Computadores (LEIC) é uma
        das maiores licenciaturas do Técnico e tem já provas dadas de sucesso no
        mercado de emprego, tanto a nível nacional como internacional. Os
        diplomados da LEIC são reconhecidos como profissionais competentes com
        conhecimentos sólidos a nível da engenharia informática e fácil
        adaptabilidade à evolução constante das tecnologias de informação.
      </p>
    </div>
    <div style={{ margin: "10px 20vw" }}>
      <h2 style={{ textAlign: "center" }}>OBJETIVOS</h2>
      <p>
        Os computadores estão por toda a parte! Na secretária, sob a forma de
        tablets ou telemóveis, embebidos em pacemakers ou bombas de insulina, a
        controlar luzes ou sistemas industriais, em automóveis ou aviões, nas
        TV’s ou nos frigoríficos. A Engenharia Informática é uma área de enorme
        impacto nas sociedades atuais que procura implementar soluções
        tecnológicas para os problemas do dia a dia. As suas aplicações variam
        desde as organizações e a sua gestão, até às telecomunicações, banca e
        seguros, saúde, educação, justiça, defesa, passando pela cultura e
        entretenimento.
      </p>
      <p>
        Com esta licenciatura estarás em condições de te adaptares às
        permanentes alterações tecnológicas que te esperam no teu futuro
        profissional, pois serás treinado com uma sólida formação de base para
        esta área da Engenharia com a qualidade de ensino ministrado no IST e
        que é reconhecida no crescente mercado nacional nesta área.
      </p>
      <p>
        A Licenciatura em Engenharia Informática e de Computadores (LEIC) do
        Técnico é oferecida nos campus da Alameda e do Taguspark com a mesma
        estrutura curricular. No final do 1º ciclo tens acesso direto à
        frequência do Mestrado em Engenharia Informática e de Computadores que
        te dará um alto nível de especialização e de abrangência de
        conhecimentos. É também possível a mobilidade para outras Escolas de
        prestígio europeias, bem como a inserção imediata no mercado de
        trabalho.
      </p>
    </div>
    <div style={{ margin: "10px 20vw" }}>
      <Button
        href="https://fenix.tecnico.ulisboa.pt/cursos/leic-t"
        target="_blank"
        rel="noreferrer"
        style={{ textAlign: "center" }}
      >
        VISITAR
      </Button>
    </div>
  </>
);

export default MajorPage;
