import Sidebar from "../components/Sidebar";

export default function HomeLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow p-4">{children}</div>
    </div>
  );
}
