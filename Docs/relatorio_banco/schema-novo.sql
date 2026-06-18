--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4 (Debian 16.4-1.pgdg110+2)
-- Dumped by pg_dump version 16.4 (Debian 16.4-1.pgdg110+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: canal_notificacao_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.canal_notificacao_enum AS ENUM (
    'SISTEMA',
    'EMAIL',
    'PUSH'
);


--
-- Name: prioridade_tarefa_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.prioridade_tarefa_enum AS ENUM (
    'BAIXA',
    'MEDIA',
    'ALTA',
    'URGENTE'
);


--
-- Name: resultado_vistoria_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.resultado_vistoria_enum AS ENUM (
    'PENDENTE',
    'CONFORME',
    'NAO_CONFORME'
);


--
-- Name: role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role_enum AS ENUM (
    'EMPRESA',
    'FISCAL',
    'ENGENHEIRO',
    'COORDENADOR',
    'SECRETARIO'
);


--
-- Name: saude_obra_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.saude_obra_enum AS ENUM (
    'VERDE',
    'AMARELO',
    'VERMELHO'
);


--
-- Name: situacao_obra_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.situacao_obra_enum AS ENUM (
    'A_INICIAR',
    'EM_ANDAMENTO',
    'PARALISADA',
    'INACABADA',
    'CONCLUIDA',
    'RESCINDIDA',
    'ARQUIVADA',
    'EXTINTA',
    'CEDIDA'
);


--
-- Name: status_medicao_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_medicao_enum AS ENUM (
    'RASCUNHO',
    'ASSINADA',
    'EM_FISCALIZACAO',
    'APROVADA',
    'REPROVADA'
);


--
-- Name: status_obra_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_obra_enum AS ENUM (
    'PLANEJADA',
    'EM_EXECUCAO',
    'PARALISADA',
    'CONCLUIDA'
);


--
-- Name: status_tarefa_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_tarefa_enum AS ENUM (
    'A_FAZER',
    'EM_ANDAMENTO',
    'CONCLUIDO'
);


--
-- Name: tipo_paralisacao_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_paralisacao_enum AS ENUM (
    'PARALISACAO',
    'REINICIO'
);


--
-- Name: tipo_portaria_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_portaria_enum AS ENUM (
    'FISCAL',
    'GESTOR',
    'OUTROS'
);


--
-- Name: tipo_readequacao_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_readequacao_enum AS ENUM (
    'COM_REFLEXO',
    'SEM_REFLEXO'
);


--
-- Name: tipo_termo_recebimento_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_termo_recebimento_enum AS ENUM (
    'PROVISORIO',
    'DEFINITIVO'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aditivos_prazo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aditivos_prazo (
    id uuid NOT NULL,
    obra_id uuid NOT NULL,
    numero integer NOT NULL,
    dias_adicionados integer NOT NULL,
    nova_data_vigencia date NOT NULL,
    nova_data_execucao date NOT NULL,
    processo_sei character varying(50),
    data_assinatura date,
    data_publicacao date,
    observacao text,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: apostilamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apostilamentos (
    id uuid NOT NULL,
    contrato_id uuid NOT NULL,
    valor numeric(15,2) NOT NULL,
    processo_sei character varying(50),
    data_assinatura date,
    data_publicacao date,
    descricao text,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: art_rrt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.art_rrt (
    id uuid NOT NULL,
    numero character varying(100) NOT NULL,
    tipo character varying(10) NOT NULL,
    obra_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    data_emissao date,
    data_validade date,
    arquivo_url character varying(500),
    ativa boolean NOT NULL,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    entidade character varying(100) NOT NULL,
    entidade_id character varying(36) NOT NULL,
    acao character varying(50) NOT NULL,
    dados_antes jsonb,
    dados_depois jsonb,
    descricao text,
    ip_address character varying(45),
    user_agent character varying(500),
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: checklist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checklist_items (
    id uuid NOT NULL,
    vistoria_id uuid NOT NULL,
    evento_id uuid NOT NULL,
    atestado boolean NOT NULL,
    observacao text
);


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contratos (
    id uuid NOT NULL,
    numero_processo character varying(50) NOT NULL,
    numero_contrato character varying(50) NOT NULL,
    valor_global numeric(15,2) NOT NULL,
    data_assinatura date,
    data_publicacao date,
    data_vigencia date,
    prazo_vigencia_dias integer,
    prazo_execucao_dias integer,
    empresa_id uuid,
    gestor_id uuid,
    orgao character varying(100),
    objeto text,
    criado_em timestamp with time zone NOT NULL,
    empresa_ref_id uuid,
    orgao_id uuid,
    fiscal_id uuid,
    valor_aditivo numeric(15,2),
    valor_reajustado numeric(15,2),
    valor_final numeric(15,2),
    recurso_federal numeric(15,2),
    recurso_estadual numeric(15,2),
    tipo_licitacao character varying(100),
    numero_licitacao character varying(100),
    matricula_cei character varying(50),
    fiscal_nome character varying(200),
    gestor_nome character varying(200)
);


--
-- Name: diario_obra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diario_obra (
    id uuid NOT NULL,
    obra_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    data_registro date NOT NULL,
    clima character varying(100),
    qtd_funcionarios integer NOT NULL,
    equipamentos text,
    ocorrencias text,
    atividades_realizadas text,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: empresas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresas (
    id uuid NOT NULL,
    razao_social character varying(300) NOT NULL,
    cnpj character varying(18),
    usuario_id uuid,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eventos (
    id uuid NOT NULL,
    submeta_id uuid NOT NULL,
    descricao character varying(500) NOT NULL,
    quantidade numeric(12,4) NOT NULL,
    unidade character varying(20) NOT NULL,
    valor_unitario numeric(12,4) NOT NULL
);


--
-- Name: fotos_vistoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fotos_vistoria (
    id uuid NOT NULL,
    vistoria_id uuid NOT NULL,
    checklist_item_id uuid,
    url_storage character varying(500),
    filename character varying(200),
    coordenadas public.geometry(Point,4326),
    hash_sha256 character varying(64),
    carimbo_servidor timestamp with time zone,
    exif_metadata jsonb,
    origem_camera boolean NOT NULL,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: medicoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicoes (
    id uuid NOT NULL,
    obra_id uuid NOT NULL,
    empresa_usuario_id uuid NOT NULL,
    numero_medicao integer NOT NULL,
    valor_medido numeric(15,2) NOT NULL,
    data_medicao date,
    numero_processo_sei character varying(50),
    status public.status_medicao_enum NOT NULL,
    eventos_declarados jsonb,
    assinada_em timestamp with time zone,
    enviada_em timestamp with time zone,
    hash_assinatura character varying(64),
    observacao_fiscal text,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: metas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metas (
    id uuid NOT NULL,
    obra_id uuid NOT NULL,
    descricao character varying(500) NOT NULL,
    valor numeric(15,2) NOT NULL,
    ordem integer NOT NULL
);


--
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacoes (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    titulo character varying(200) NOT NULL,
    mensagem text,
    canal public.canal_notificacao_enum NOT NULL,
    lida boolean NOT NULL,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: notificacoes_extrajudiciais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacoes_extrajudiciais (
    id uuid NOT NULL,
    obra_id uuid NOT NULL,
    empresa_id uuid NOT NULL,
    numero character varying(50) NOT NULL,
    data_emissao date NOT NULL,
    data_recebimento date,
    assunto character varying(300) NOT NULL,
    teor text,
    processo_sei character varying(50),
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: obras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.obras (
    id uuid NOT NULL,
    titulo character varying(300) NOT NULL,
    descricao text,
    localizacao public.geometry(Point,4326),
    endereco character varying(500),
    municipio character varying(100),
    valor_contrato numeric(15,2) NOT NULL,
    data_inicio date,
    data_fim_prevista date,
    data_ordem_servico date,
    status public.status_obra_enum NOT NULL,
    saude public.saude_obra_enum NOT NULL,
    percentual_executado numeric(5,2) NOT NULL,
    raio_geofencing_metros integer NOT NULL,
    contrato_id uuid,
    responsavel_id uuid,
    gestor_id uuid,
    orgao character varying(100),
    ativo boolean NOT NULL,
    criado_em timestamp with time zone NOT NULL,
    atualizado_em timestamp with time zone NOT NULL,
    situacao public.situacao_obra_enum,
    situacao_origem character varying(100),
    ano_referencia integer,
    prazo_inicial_dias integer,
    vigencia_inicio date,
    vigencia_dias integer,
    vigencia_fim date,
    execucao_inicio date,
    execucao_dias integer,
    execucao_fim date,
    valor_medido numeric(15,2),
    saldo_a_medir numeric(15,2),
    matricula_cei character varying(50),
    historico text,
    importante text,
    observacoes text
);


--
-- Name: ordens_servico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordens_servico (
    id uuid NOT NULL,
    obra_id uuid NOT NULL,
    numero character varying(50) NOT NULL,
    data_emissao date NOT NULL,
    data_inicio date,
    processo_sei character varying(50),
    observacao text,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: orgaos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orgaos (
    id uuid NOT NULL,
    sigla character varying(40) NOT NULL,
    nome character varying(200),
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: paralisacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paralisacoes (
    id uuid NOT NULL,
    obra_id uuid NOT NULL,
    tipo public.tipo_paralisacao_enum NOT NULL,
    data_evento date NOT NULL,
    data_publicacao date,
    saldo_dias_execucao integer,
    saldo_dias_vigencia integer,
    processo_sei character varying(50),
    motivo text,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: portarias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portarias (
    id uuid NOT NULL,
    obra_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    tipo public.tipo_portaria_enum NOT NULL,
    numero character varying(50) NOT NULL,
    data_emissao date NOT NULL,
    data_publicacao date,
    processo_sei character varying(50),
    observacao text,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: readequacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.readequacoes (
    id uuid NOT NULL,
    obra_id uuid NOT NULL,
    numero integer NOT NULL,
    tipo public.tipo_readequacao_enum NOT NULL,
    percentual numeric(6,2),
    valor numeric(15,2),
    processo_sei character varying(50),
    data_assinatura date,
    data_publicacao date,
    observacao text,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: reajustes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reajustes (
    id uuid NOT NULL,
    medicao_id uuid NOT NULL,
    valor numeric(15,2) NOT NULL,
    processo_sei character varying(50),
    data_assinatura date,
    data_publicacao date,
    observacao text,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: submetas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submetas (
    id uuid NOT NULL,
    meta_id uuid NOT NULL,
    descricao character varying(500) NOT NULL,
    valor numeric(15,2) NOT NULL,
    percentual_previsto numeric(5,2) NOT NULL
);


--
-- Name: tarefas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarefas (
    id uuid NOT NULL,
    titulo character varying(200) NOT NULL,
    descricao text,
    status public.status_tarefa_enum NOT NULL,
    prioridade public.prioridade_tarefa_enum NOT NULL,
    prazo date,
    obra_id uuid,
    responsavel_id uuid,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: termos_recebimento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.termos_recebimento (
    id uuid NOT NULL,
    obra_id uuid NOT NULL,
    tipo public.tipo_termo_recebimento_enum NOT NULL,
    numero character varying(50) NOT NULL,
    data_emissao date NOT NULL,
    data_publicacao date,
    processo_sei character varying(50),
    observacao text,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    matricula_cnpj character varying(20) NOT NULL,
    senha_hash text NOT NULL,
    tipo public.role_enum NOT NULL,
    ativo boolean NOT NULL,
    telefone character varying(20),
    cargo character varying(100),
    criado_em timestamp with time zone NOT NULL,
    atualizado_em timestamp with time zone NOT NULL
);


--
-- Name: vistorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vistorias (
    id uuid NOT NULL,
    obra_id uuid NOT NULL,
    fiscal_id uuid NOT NULL,
    medicao_id uuid,
    local_checkin public.geometry(Point,4326),
    checkin_em timestamp with time zone,
    dentro_raio boolean NOT NULL,
    distancia_metros double precision,
    resultado public.resultado_vistoria_enum NOT NULL,
    observacoes text,
    finalizada_em timestamp with time zone,
    criado_em timestamp with time zone NOT NULL
);


--
-- Name: aditivos_prazo aditivos_prazo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aditivos_prazo
    ADD CONSTRAINT aditivos_prazo_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: apostilamentos apostilamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apostilamentos
    ADD CONSTRAINT apostilamentos_pkey PRIMARY KEY (id);


--
-- Name: art_rrt art_rrt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.art_rrt
    ADD CONSTRAINT art_rrt_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: checklist_items checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklist_items
    ADD CONSTRAINT checklist_items_pkey PRIMARY KEY (id);


--
-- Name: contratos contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_pkey PRIMARY KEY (id);


--
-- Name: diario_obra diario_obra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diario_obra
    ADD CONSTRAINT diario_obra_pkey PRIMARY KEY (id);


--
-- Name: empresas empresas_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_cnpj_key UNIQUE (cnpj);


--
-- Name: empresas empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_pkey PRIMARY KEY (id);


--
-- Name: eventos eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id);


--
-- Name: fotos_vistoria fotos_vistoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos_vistoria
    ADD CONSTRAINT fotos_vistoria_pkey PRIMARY KEY (id);


--
-- Name: medicoes medicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicoes
    ADD CONSTRAINT medicoes_pkey PRIMARY KEY (id);


--
-- Name: metas metas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metas
    ADD CONSTRAINT metas_pkey PRIMARY KEY (id);


--
-- Name: notificacoes_extrajudiciais notificacoes_extrajudiciais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_extrajudiciais
    ADD CONSTRAINT notificacoes_extrajudiciais_pkey PRIMARY KEY (id);


--
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);


--
-- Name: obras obras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_pkey PRIMARY KEY (id);


--
-- Name: ordens_servico ordens_servico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordens_servico
    ADD CONSTRAINT ordens_servico_pkey PRIMARY KEY (id);


--
-- Name: orgaos orgaos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orgaos
    ADD CONSTRAINT orgaos_pkey PRIMARY KEY (id);


--
-- Name: paralisacoes paralisacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paralisacoes
    ADD CONSTRAINT paralisacoes_pkey PRIMARY KEY (id);


--
-- Name: portarias portarias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias
    ADD CONSTRAINT portarias_pkey PRIMARY KEY (id);


--
-- Name: readequacoes readequacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.readequacoes
    ADD CONSTRAINT readequacoes_pkey PRIMARY KEY (id);


--
-- Name: reajustes reajustes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reajustes
    ADD CONSTRAINT reajustes_pkey PRIMARY KEY (id);


--
-- Name: submetas submetas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submetas
    ADD CONSTRAINT submetas_pkey PRIMARY KEY (id);


--
-- Name: tarefas tarefas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarefas
    ADD CONSTRAINT tarefas_pkey PRIMARY KEY (id);


--
-- Name: termos_recebimento termos_recebimento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_recebimento
    ADD CONSTRAINT termos_recebimento_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: vistorias vistorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistorias
    ADD CONSTRAINT vistorias_pkey PRIMARY KEY (id);


--
-- Name: idx_fotos_vistoria_coordenadas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_vistoria_coordenadas ON public.fotos_vistoria USING gist (coordenadas);


--
-- Name: idx_obras_localizacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_obras_localizacao ON public.obras USING gist (localizacao);


--
-- Name: idx_vistorias_local_checkin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vistorias_local_checkin ON public.vistorias USING gist (local_checkin);


--
-- Name: ix_art_rrt_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_art_rrt_numero ON public.art_rrt USING btree (numero);


--
-- Name: ix_audit_logs_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_criado_em ON public.audit_logs USING btree (criado_em);


--
-- Name: ix_audit_logs_entidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_entidade ON public.audit_logs USING btree (entidade);


--
-- Name: ix_audit_logs_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_entidade_id ON public.audit_logs USING btree (entidade_id);


--
-- Name: ix_contratos_numero_contrato; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_contratos_numero_contrato ON public.contratos USING btree (numero_contrato);


--
-- Name: ix_empresas_razao_social; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_empresas_razao_social ON public.empresas USING btree (razao_social);


--
-- Name: ix_orgaos_sigla; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_orgaos_sigla ON public.orgaos USING btree (sigla);


--
-- Name: ix_usuarios_matricula_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_usuarios_matricula_cnpj ON public.usuarios USING btree (matricula_cnpj);


--
-- Name: aditivos_prazo aditivos_prazo_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aditivos_prazo
    ADD CONSTRAINT aditivos_prazo_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: apostilamentos apostilamentos_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apostilamentos
    ADD CONSTRAINT apostilamentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: art_rrt art_rrt_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.art_rrt
    ADD CONSTRAINT art_rrt_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: art_rrt art_rrt_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.art_rrt
    ADD CONSTRAINT art_rrt_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: checklist_items checklist_items_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklist_items
    ADD CONSTRAINT checklist_items_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id);


--
-- Name: checklist_items checklist_items_vistoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklist_items
    ADD CONSTRAINT checklist_items_vistoria_id_fkey FOREIGN KEY (vistoria_id) REFERENCES public.vistorias(id) ON DELETE CASCADE;


--
-- Name: contratos contratos_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.usuarios(id);


--
-- Name: contratos contratos_gestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES public.usuarios(id);


--
-- Name: diario_obra diario_obra_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diario_obra
    ADD CONSTRAINT diario_obra_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: diario_obra diario_obra_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diario_obra
    ADD CONSTRAINT diario_obra_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: eventos eventos_submeta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_submeta_id_fkey FOREIGN KEY (submeta_id) REFERENCES public.submetas(id) ON DELETE CASCADE;


--
-- Name: contratos fk_contratos_empresa_ref; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT fk_contratos_empresa_ref FOREIGN KEY (empresa_ref_id) REFERENCES public.empresas(id);


--
-- Name: contratos fk_contratos_fiscal; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT fk_contratos_fiscal FOREIGN KEY (fiscal_id) REFERENCES public.usuarios(id);


--
-- Name: contratos fk_contratos_orgao; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT fk_contratos_orgao FOREIGN KEY (orgao_id) REFERENCES public.orgaos(id);


--
-- Name: fotos_vistoria fotos_vistoria_checklist_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos_vistoria
    ADD CONSTRAINT fotos_vistoria_checklist_item_id_fkey FOREIGN KEY (checklist_item_id) REFERENCES public.checklist_items(id);


--
-- Name: fotos_vistoria fotos_vistoria_vistoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos_vistoria
    ADD CONSTRAINT fotos_vistoria_vistoria_id_fkey FOREIGN KEY (vistoria_id) REFERENCES public.vistorias(id) ON DELETE CASCADE;


--
-- Name: medicoes medicoes_empresa_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicoes
    ADD CONSTRAINT medicoes_empresa_usuario_id_fkey FOREIGN KEY (empresa_usuario_id) REFERENCES public.usuarios(id);


--
-- Name: medicoes medicoes_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicoes
    ADD CONSTRAINT medicoes_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: metas metas_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metas
    ADD CONSTRAINT metas_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: notificacoes_extrajudiciais notificacoes_extrajudiciais_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_extrajudiciais
    ADD CONSTRAINT notificacoes_extrajudiciais_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.usuarios(id);


--
-- Name: notificacoes_extrajudiciais notificacoes_extrajudiciais_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_extrajudiciais
    ADD CONSTRAINT notificacoes_extrajudiciais_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: notificacoes notificacoes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: obras obras_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id);


--
-- Name: obras obras_gestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES public.usuarios(id);


--
-- Name: obras obras_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.usuarios(id);


--
-- Name: ordens_servico ordens_servico_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordens_servico
    ADD CONSTRAINT ordens_servico_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: paralisacoes paralisacoes_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paralisacoes
    ADD CONSTRAINT paralisacoes_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: portarias portarias_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias
    ADD CONSTRAINT portarias_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: portarias portarias_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias
    ADD CONSTRAINT portarias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: readequacoes readequacoes_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.readequacoes
    ADD CONSTRAINT readequacoes_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: reajustes reajustes_medicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reajustes
    ADD CONSTRAINT reajustes_medicao_id_fkey FOREIGN KEY (medicao_id) REFERENCES public.medicoes(id) ON DELETE CASCADE;


--
-- Name: submetas submetas_meta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submetas
    ADD CONSTRAINT submetas_meta_id_fkey FOREIGN KEY (meta_id) REFERENCES public.metas(id) ON DELETE CASCADE;


--
-- Name: tarefas tarefas_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarefas
    ADD CONSTRAINT tarefas_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: tarefas tarefas_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarefas
    ADD CONSTRAINT tarefas_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: termos_recebimento termos_recebimento_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_recebimento
    ADD CONSTRAINT termos_recebimento_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: vistorias vistorias_fiscal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistorias
    ADD CONSTRAINT vistorias_fiscal_id_fkey FOREIGN KEY (fiscal_id) REFERENCES public.usuarios(id);


--
-- Name: vistorias vistorias_medicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistorias
    ADD CONSTRAINT vistorias_medicao_id_fkey FOREIGN KEY (medicao_id) REFERENCES public.medicoes(id);


--
-- Name: vistorias vistorias_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistorias
    ADD CONSTRAINT vistorias_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

