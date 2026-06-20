const Privacidade = () => (
  <div className="max-w-3xl mx-auto">
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Política de Privacidade</h1>
      <p className="text-sm text-slate-500">Última atualização: Junho de 2026</p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">1. Coleta de Dados</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          O SIN-Obras coleta apenas os dados estritamente necessários para a gestão de obras
          públicas do Estado do Rio Grande do Norte. Isso inclui dados cadastrais de usuários
          (nome, e-mail, matrícula institucional ou CNPJ), registros de obras, contratos,
          medições e diários de obras.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">2. Finalidade</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Os dados coletados são utilizados exclusivamente para fins de fiscalização,
          acompanhamento, transparência e controle de obras públicas, em conformidade
          com a legislação estadual e federal aplicável.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">3. Compartilhamento</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Os dados não são compartilhados com terceiros, exceto quando exigido por lei
          ou determinação judicial. O acesso interno é restrito por perfis de acesso
          (RBAC), garantindo que cada usuário visualize apenas as informações pertinentes
          à sua função.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">4. Segurança</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Adotamos medidas técnicas e organizacionais para proteger os dados contra
          acessos não autorizados, perda ou alteração. As senhas são armazenadas com
          hash criptográfico (bcrypt) e a comunicação é feita via HTTPS.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">5. Direitos do Titular</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Nos termos da Lei Geral de Proteção de Dados (LGPD), você tem direito a
          acessar, corrigir ou solicitar a exclusão dos seus dados pessoais. Para
          exercer esses direitos, entre em contato com a Assessoria de Informática
          da infra-RN.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">6. Contato</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Assessoria de Informática — infra-RN
          <br />
          E-mail: privacidade@infrarngovbr
        </p>
      </section>
    </div>
  </div>
);

export default Privacidade;
