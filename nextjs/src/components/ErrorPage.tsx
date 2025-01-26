interface ErrorPageProps {
  title: string;
  description: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export default function ErrorPage({ title, description, action }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-xl text-gray-600 mb-8">{description}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {action.text}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 