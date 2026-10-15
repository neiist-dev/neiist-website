import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Modal, Button, Text, Stack, Field, Input, MultiSelect, Alert } from "@neiist/ui";

export default function ModalDemo() {
  const [openBasic, setOpenBasic] = useState(false);
  const [openMandateModal, setOpenMandateModal] = useState(false);
  const [openCreateUserModal, setOpenCreateUserModal] = useState(false);

  const [users, setUsers] = useState<string[]>([
    "Student 1 (ist100001)",
    "Student 2 (ist100002)",
    "Student 3 (ist100003)",
  ]);
  const [selectedUser, setSelectedUser] = useState<string>("Student 1 (ist100001)");
  const [selectedDept, setSelectedDept] = useState<string>("Dev-Team");
  const [selectedRole, setSelectedRole] = useState<string>("Coordenador");
  const [newName, setNewName] = useState("");
  const [newIstId, setNewIstId] = useState("");
  const [newCourses, setNewCourses] = useState<string[]>(["MEIC-T"]);

  const handleCloseCreateUserModal = () => {
    setNewName("");
    setNewIstId("");
    setOpenCreateUserModal(false);
  };

  const handleCreateUser = () => {
    if (!newName.trim() || !newIstId.trim()) {
      Alert.error("Preencha o nome e o IST ID para criar o utilizador.");
      return;
    }
    const label = `${newName.trim()} (${newIstId.trim()})`;
    setUsers((prev) => [...prev, label]);
    setSelectedUser(label);
    Alert.success(`Utilizador ${label} criado com sucesso!`);
    setNewName("");
    setNewIstId("");
    setOpenCreateUserModal(false);
  };

  return (
    <>
      <PageHeader
        title="Modal"
        description="A dialog component that blocks interaction with the rest of the page, supporting native stacking and drawer management on mobile."
      />

      <DemoCard
        title="Multi-Modal & Stacking Test Bed (Management Flow)"
        description="Simulates the management console flow with nested sub-modals, mobile select drawers, and toasts rendering on top of modals.">
        <Stack direction="row" gap="md" wrap>
          <Button variant="solid" color="primary" onClick={() => setOpenMandateModal(true)}>
            Adicionar Mandato (Abrir Modal Principal)
          </Button>
        </Stack>

        <Modal open={openMandateModal} onClose={() => setOpenMandateModal(false)} size="lg">
          <Modal.Header
            title="Adicionar Mandato"
            subtitle="Atribuir um cargo e departamento a um membro"
            onClose={() => setOpenMandateModal(false)}
          />
          <Modal.Body>
            <Stack gap="lg">
              <Field label="Membro">
                <MultiSelect
                  availableItems={users}
                  selectedItem={selectedUser}
                  onSelect={(user) => setSelectedUser(user as string)}
                  multiSelect={false}
                  placeholder="Selecione ou crie um membro..."
                  createLabel="Criar novo utilizador"
                  mobileDrawerTitle="Membro"
                  onItemCreate={(query) => {
                    setNewIstId(query);
                    setOpenCreateUserModal(true);
                  }}
                />
              </Field>

              <Field label="Departamento">
                <MultiSelect
                  availableItems={["Dev-Team", "Divulgação", "Direção", "Contacto", "Qualidade"]}
                  selectedItem={selectedDept}
                  onSelect={(dept) => setSelectedDept(dept as string)}
                  multiSelect={false}
                  placeholder="Selecione o departamento..."
                  mobileDrawerTitle="Departamento"
                />
              </Field>

              <Field label="Cargo">
                <MultiSelect
                  availableItems={["Coordenador", "Colaborador", "Vogal", "Presidente"]}
                  selectedItem={selectedRole}
                  onSelect={(role) => setSelectedRole(role as string)}
                  multiSelect={false}
                  placeholder="Selecione o cargo..."
                  mobileDrawerTitle="Cargo"
                />
              </Field>

              <Stack direction="row" gap="sm" wrap>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => Alert.info("Notificação de informação dentro do modal!")}>
                  Testar Alerta no Modal
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOpenCreateUserModal(true)}>
                  Abrir Sub-Modal Diretamente
                </Button>
              </Stack>
            </Stack>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setOpenMandateModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="solid"
              color="primary"
              onClick={() => {
                Alert.success(`Mandato gravado para ${selectedUser} em ${selectedDept}!`);
                setOpenMandateModal(false);
              }}>
              Guardar Mandato
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal open={openCreateUserModal} onClose={handleCloseCreateUserModal} size="md">
          <Modal.Header
            title="Criar Novo Utilizador"
            subtitle="Registar estudante a partir de Fénix ou manual"
            onClose={handleCloseCreateUserModal}
          />
          <Modal.Body>
            <Stack gap="md">
              <Field label="Nome Completo">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Student 4"
                />
              </Field>

              <Field label="IST ID">
                <Input
                  value={newIstId}
                  onChange={(e) => setNewIstId(e.target.value)}
                  placeholder="Ex: ist100004"
                />
              </Field>

              <Field label="Cursos">
                <MultiSelect
                  availableItems={["LEIC-A", "LEIC-T", "MEIC-A", "MEIC-T"]}
                  selectedItems={newCourses}
                  onChange={setNewCourses}
                  placeholder="Selecione os cursos..."
                  mobileDrawerTitle="Cursos"
                />
              </Field>
            </Stack>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={handleCloseCreateUserModal}>
              Cancelar
            </Button>
            <Button variant="solid" color="primary" onClick={handleCreateUser}>
              Criar e Selecionar
            </Button>
          </Modal.Footer>
        </Modal>
      </DemoCard>

      <DemoCard
        title="Compound Modal with Sizes"
        description="Modal with compound slots (Header, Body, Footer) and responsive sizing.">
        <Stack direction="row" gap="md" wrap>
          <Button variant="outline" onClick={() => setOpenBasic(true)}>
            Abrir Modal Básico
          </Button>
        </Stack>

        <Modal open={openBasic} onClose={() => setOpenBasic(false)} size="lg">
          <Modal.Header
            title="Gestão de Sócios"
            subtitle="Configurações e detalhes do núcleo"
            onClose={() => setOpenBasic(false)}
          />
          <Modal.Body>
            <Text>
              O componente Modal suporta composição com subcomponentes e tamanhos pré-definidos (sm,
              md, lg, xl, full, auto) para se ajustar a qualquer caso de uso na aplicação.
            </Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setOpenBasic(false)}>
              Fechar
            </Button>
            <Button variant="solid" color="primary" onClick={() => setOpenBasic(false)}>
              Confirmar
            </Button>
          </Modal.Footer>
        </Modal>
      </DemoCard>
    </>
  );
}
