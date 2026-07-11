// Manifest content script entry. Runtime setup lives in apps/content.
import '../platform/browser/compatBootstrap';
export { onExecute } from '../apps/content/bootstrap';
