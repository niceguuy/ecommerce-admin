import ChatbotWorkspace from "../../../components/chatbot/ChatbotWorkspace";

type BotWorkspacePageProps = {
  params: Promise<{
    botId: string;
  }>;
};

export default async function BotWorkspacePage({
  params,
}: BotWorkspacePageProps) {
  const { botId } = await params;
  return <ChatbotWorkspace botId={botId} />;
}