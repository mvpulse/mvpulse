import { Switch, Route } from "wouter";
import { Layout } from "@/components/Layout";
import { AIChatAssistant } from "@/components/AIChatAssistant";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import CreatePoll from "@/pages/CreatePoll";
import PollDetails from "@/pages/PollDetails";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/projects" component={Projects} />
        <Route path="/create" component={CreatePoll} />
        <Route path="/poll/:id" component={PollDetails} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
      <AIChatAssistant />
    </Layout>
  );
}

export default App;
