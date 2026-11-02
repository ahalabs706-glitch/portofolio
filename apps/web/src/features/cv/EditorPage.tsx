import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { Link, useBlocker, useParams } from "react-router-dom";
import type { Path } from "react-hook-form";

import {
  createEmptyCvData,
  cvDataSchema,
  templateNames,
  type CvData,
  type CvTemplate,
} from "./model.js";
import { CvPreview } from "./CvPreview.js";
import { getCvDocument, saveCvDocument } from "../../lib/api.js";

const cvKey = (id: string) => ["cv-document", id] as const;
const cvListKey = ["cv-documents"] as const;

const experienceTemplate = {
  company: "",
  role: "",
  employmentType: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  responsibilities: "",
  achievements: "",
  technologies: "",
};

const educationTemplate = {
  institution: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
  description: "",
};

const skillTemplate = { name: "", category: "", proficiency: "" };

const projectTemplate = {
  name: "",
  description: "",
  technologies: "",
  repositoryUrl: "",
  demoUrl: "",
};

const certificationTemplate = {
  name: "",
  issuer: "",
  issueDate: "",
  expirationDate: "",
  credentialUrl: "",
};

function Field({
  label,
  name,
  type = "text",
  placeholder,
  multiline = false,
  hint,
}: {
  label: string;
  name: Path<CvData>;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
}) {
  const { register, getFieldState, formState } = useFormContext<CvData>();
  const { error } = getFieldState(name, formState);
  const id = `field-${name.replaceAll(".", "-")}`;
  const registration = register(name);

  return (
    <label className="editor-field" htmlFor={id}>
      <span>{label}</span>
      {multiline ? (
        <textarea
          {...registration}
          id={id}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          rows={4}
        />
      ) : (
        <input
          {...registration}
          id={id}
          type={type}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        />
      )}
      {hint && !error && (
        <small id={`${id}-hint`} className="field-hint">
          {hint}
        </small>
      )}
      {error?.message && (
        <small id={`${id}-error`} className="field-error" role="alert">
          {error.message}
        </small>
      )}
    </label>
  );
}

function EditorSection({
  number,
  title,
  description,
  children,
  action,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="editor-section">
      <div className="editor-section-heading">
        <div className="editor-section-number">{number}</div>
        <div className="editor-section-title">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </div>
      <div className="editor-section-content">{children}</div>
    </section>
  );
}

function EntryActions({
  onMoveUp,
  onMoveDown,
  onRemove,
  isFirst,
  isLast,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="entry-actions">
      <button
        className="icon-button"
        type="button"
        onClick={onMoveUp}
        disabled={isFirst}
        aria-label="Move item up"
        title="Move up"
      >
        <ChevronUp size={16} aria-hidden="true" />
      </button>
      <button
        className="icon-button"
        type="button"
        onClick={onMoveDown}
        disabled={isLast}
        aria-label="Move item down"
        title="Move down"
      >
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <button
        className="icon-button icon-button-danger"
        type="button"
        onClick={onRemove}
        aria-label="Remove item"
        title="Remove"
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function ExperienceFields() {
  const { control, register } = useFormContext<CvData>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "experience" });
  return (
    <EditorSection
      number="02"
      title="Experience"
      description="Focus on outcomes and impact, not just responsibilities."
      action={
        <button
          className="text-button add-entry-button"
          type="button"
          onClick={() => append(experienceTemplate)}
        >
          <Plus size={15} aria-hidden="true" /> Add role
        </button>
      }
    >
      {fields.length === 0 && (
        <p className="section-empty-hint">Add your most recent role first.</p>
      )}
      {fields.map((field, index) => (
        <div className="repeat-entry" key={field.id}>
          <div className="repeat-entry-heading">
            <h3>Role {index + 1}</h3>
            <EntryActions
              onMoveUp={() => move(index, index - 1)}
              onMoveDown={() => move(index, index + 1)}
              onRemove={() => remove(index)}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
            />
          </div>
          <div className="editor-field-grid">
            <Field
              label="Job title"
              name={`experience.${index}.role`}
              placeholder="Product Designer"
            />
            <Field
              label="Company"
              name={`experience.${index}.company`}
              placeholder="Studio North"
            />
            <Field
              label="Employment type"
              name={`experience.${index}.employmentType`}
              placeholder="Full-time"
            />
            <Field
              label="Location"
              name={`experience.${index}.location`}
              placeholder="New York, NY"
            />
            <Field
              label="Start date"
              name={`experience.${index}.startDate`}
              type="month"
            />
            <Field label="End date" name={`experience.${index}.endDate`} type="month" />
          </div>
          <label className="check-field">
            <input type="checkbox" {...register(`experience.${index}.current`)} />
            <span>I currently work here</span>
          </label>
          <Field
            label="Responsibilities"
            name={`experience.${index}.responsibilities`}
            multiline
            placeholder="One accomplishment per line"
          />
          <Field
            label="Achievements"
            name={`experience.${index}.achievements`}
            multiline
            placeholder="Add measurable outcomes and wins"
          />
          <Field
            label="Technologies"
            name={`experience.${index}.technologies`}
            placeholder="Figma, research, prototyping"
          />
        </div>
      ))}
    </EditorSection>
  );
}

function EducationFields() {
  const { control } = useFormContext<CvData>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "education" });
  return (
    <EditorSection
      number="03"
      title="Education"
      description="Add degrees, courses, or other relevant learning."
      action={
        <button
          className="text-button add-entry-button"
          type="button"
          onClick={() => append(educationTemplate)}
        >
          <Plus size={15} aria-hidden="true" /> Add education
        </button>
      }
    >
      {fields.length === 0 && (
        <p className="section-empty-hint">No education added yet.</p>
      )}
      {fields.map((field, index) => (
        <div className="repeat-entry" key={field.id}>
          <div className="repeat-entry-heading">
            <h3>Education {index + 1}</h3>
            <EntryActions
              onMoveUp={() => move(index, index - 1)}
              onMoveDown={() => move(index, index + 1)}
              onRemove={() => remove(index)}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
            />
          </div>
          <div className="editor-field-grid">
            <Field label="Institution" name={`education.${index}.institution`} />
            <Field label="Degree" name={`education.${index}.degree`} />
            <Field label="Field of study" name={`education.${index}.field`} />
            <Field
              label="Start date"
              name={`education.${index}.startDate`}
              type="month"
            />
            <Field label="End date" name={`education.${index}.endDate`} type="month" />
          </div>
          <Field label="Description" name={`education.${index}.description`} multiline />
        </div>
      ))}
    </EditorSection>
  );
}

function SkillsFields() {
  const { control } = useFormContext<CvData>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "skills" });
  return (
    <EditorSection
      number="04"
      title="Skills"
      description="Highlight the capabilities you want people to remember."
      action={
        <button
          className="text-button add-entry-button"
          type="button"
          onClick={() => append(skillTemplate)}
        >
          <Plus size={15} aria-hidden="true" /> Add skill
        </button>
      }
    >
      {fields.length === 0 && <p className="section-empty-hint">No skills added yet.</p>}
      {fields.map((field, index) => (
        <div className="repeat-entry repeat-entry-compact" key={field.id}>
          <div className="editor-field-grid editor-field-grid-three">
            <Field
              label="Skill"
              name={`skills.${index}.name`}
              placeholder="Product strategy"
            />
            <Field
              label="Category"
              name={`skills.${index}.category`}
              placeholder="Design"
            />
            <Field
              label="Proficiency"
              name={`skills.${index}.proficiency`}
              placeholder="Advanced"
            />
          </div>
          <EntryActions
            onMoveUp={() => move(index, index - 1)}
            onMoveDown={() => move(index, index + 1)}
            onRemove={() => remove(index)}
            isFirst={index === 0}
            isLast={index === fields.length - 1}
          />
        </div>
      ))}
    </EditorSection>
  );
}

function ProjectFields() {
  const { control } = useFormContext<CvData>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "projects" });
  return (
    <EditorSection
      number="05"
      title="Projects"
      description="Show the work that best represents how you think and build."
      action={
        <button
          className="text-button add-entry-button"
          type="button"
          onClick={() => append(projectTemplate)}
        >
          <Plus size={15} aria-hidden="true" /> Add project
        </button>
      }
    >
      {fields.length === 0 && (
        <p className="section-empty-hint">No projects added yet.</p>
      )}
      {fields.map((field, index) => (
        <div className="repeat-entry" key={field.id}>
          <div className="repeat-entry-heading">
            <h3>Project {index + 1}</h3>
            <EntryActions
              onMoveUp={() => move(index, index - 1)}
              onMoveDown={() => move(index, index + 1)}
              onRemove={() => remove(index)}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
            />
          </div>
          <div className="editor-field-grid">
            <Field label="Project name" name={`projects.${index}.name`} />
            <Field
              label="Technologies"
              name={`projects.${index}.technologies`}
              placeholder="TypeScript, PostgreSQL"
            />
            <Field
              label="Repository URL"
              name={`projects.${index}.repositoryUrl`}
              type="url"
            />
            <Field label="Live demo URL" name={`projects.${index}.demoUrl`} type="url" />
          </div>
          <Field label="Description" name={`projects.${index}.description`} multiline />
        </div>
      ))}
    </EditorSection>
  );
}

function CertificationFields() {
  const { control } = useFormContext<CvData>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "certifications",
  });
  return (
    <EditorSection
      number="06"
      title="Certifications"
      description="Add credentials that support your professional story."
      action={
        <button
          className="text-button add-entry-button"
          type="button"
          onClick={() => append(certificationTemplate)}
        >
          <Plus size={15} aria-hidden="true" /> Add certification
        </button>
      }
    >
      {fields.length === 0 && (
        <p className="section-empty-hint">No certifications added yet.</p>
      )}
      {fields.map((field, index) => (
        <div className="repeat-entry" key={field.id}>
          <div className="repeat-entry-heading">
            <h3>Certification {index + 1}</h3>
            <EntryActions
              onMoveUp={() => move(index, index - 1)}
              onMoveDown={() => move(index, index + 1)}
              onRemove={() => remove(index)}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
            />
          </div>
          <div className="editor-field-grid">
            <Field label="Certification" name={`certifications.${index}.name`} />
            <Field label="Issuing organization" name={`certifications.${index}.issuer`} />
            <Field
              label="Issue date"
              name={`certifications.${index}.issueDate`}
              type="month"
            />
            <Field
              label="Expiration date"
              name={`certifications.${index}.expirationDate`}
              type="month"
            />
            <Field
              label="Credential URL"
              name={`certifications.${index}.credentialUrl`}
              type="url"
            />
          </div>
        </div>
      ))}
    </EditorSection>
  );
}

const additionalSections = [
  ["languages", "Languages"],
  ["awards", "Awards"],
  ["publications", "Publications"],
  ["volunteer", "Volunteer experience"],
] as const;

function AdditionalFields() {
  const { watch, setValue } = useFormContext<CvData>();
  const enabled = watch("optionalSections");
  return (
    <EditorSection
      number="07"
      title="More about you"
      description="Choose any additional sections that help tell your story."
    >
      <fieldset className="section-toggles">
        <legend>Show these sections in your CV</legend>
        {(
          [
            ["skills", "Skills"],
            ["certifications", "Certifications"],
            ...additionalSections,
          ] as const
        ).map(([key, label]) => (
          <label className="check-field section-toggle" key={key}>
            <input
              type="checkbox"
              checked={enabled[key]}
              onChange={(event) =>
                setValue(`optionalSections.${key}`, event.target.checked, {
                  shouldDirty: true,
                })
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      <div className="editor-field-grid">
        {additionalSections.map(([name, label]) => (
          <label className="editor-field" key={name}>
            <span>{label}</span>
            <textarea
              value={watch(name).join("\n")}
              onChange={(event) =>
                setValue(name, event.target.value.split(/\r?\n/), { shouldDirty: true })
              }
              rows={3}
              placeholder="One entry per line"
            />
            <small className="field-hint">One entry per line. Leave empty to omit.</small>
          </label>
        ))}
      </div>
    </EditorSection>
  );
}

function PersonalFields() {
  return (
    <EditorSection
      number="01"
      title="The essentials"
      description="Let’s start with how you want to introduce yourself."
    >
      <div className="editor-field-grid">
        <Field label="Full name" name="personal.fullName" placeholder="Alex Morgan" />
        <Field
          label="Professional title"
          name="personal.title"
          placeholder="Product Designer"
        />
        <Field
          label="Email"
          name="personal.email"
          type="email"
          placeholder="alex@example.com"
        />
        <Field label="Phone" name="personal.phone" type="tel" placeholder="+1 555 0100" />
        <Field
          label="Location"
          name="personal.location"
          placeholder="Brooklyn, New York"
        />
        <Field
          label="Profile photo URL"
          name="personal.photoUrl"
          type="url"
          placeholder="https://"
          hint="Optional. The linked image will load in the preview."
        />
        <Field
          label="Website"
          name="personal.website"
          type="url"
          placeholder="https://"
        />
        <Field
          label="LinkedIn"
          name="personal.linkedIn"
          type="url"
          placeholder="https://"
        />
        <Field label="GitHub" name="personal.github" type="url" placeholder="https://" />
      </div>
      <Field
        label="Professional summary"
        name="personal.summary"
        multiline
        placeholder="A short introduction that captures your strengths, focus, and point of view."
      />
    </EditorSection>
  );
}

function saveStatusText(status: SaveStatus) {
  if (status === "saving") return "Saving…";
  if (status === "saved") return "All changes saved";
  if (status === "invalid") return "Add your full name and fix invalid fields to save";
  if (status === "error") return "Could not save your changes";
  return "Unsaved changes";
}

type SaveStatus = "saved" | "unsaved" | "saving" | "invalid" | "error";

function EditorForm({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: cvKey(id), queryFn: () => getCvDocument(id) });
  const [template, setTemplate] = useState<CvTemplate>("modern");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const blocker = useBlocker(hasUnsavedChanges);
  const initializedId = useRef<string | null>(null);
  const isInitializing = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const editVersion = useRef(0);
  const templateRef = useRef<CvTemplate>("modern");

  const form = useForm<CvData>({
    resolver: zodResolver(cvDataSchema),
    defaultValues: query.data?.data ?? createEmptyCvData(),
    mode: "onBlur",
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      data,
      template: selectedTemplate,
    }: {
      data: CvData;
      template: CvTemplate;
    }) => saveCvDocument(id, data, selectedTemplate),
    onSuccess: (document) => {
      queryClient.setQueryData(cvKey(id), document);
      void queryClient.invalidateQueries({ queryKey: cvListKey });
    },
  });
  const { mutateAsync: saveDraftAsync } = saveMutation;

  useEffect(() => {
    if (!query.data || initializedId.current === id) return;
    initializedId.current = id;
    isInitializing.current = true;
    form.reset(query.data.data);
    templateRef.current = query.data.template;
    setTemplate(query.data.template);
    isInitializing.current = false;
  }, [form, id, query.data]);

  const scheduleAutosave = useCallback(() => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      const parsed = cvDataSchema.safeParse(form.getValues());
      if (!parsed.success) {
        setSaveStatus("invalid");
        return;
      }

      const savingVersion = editVersion.current;
      setSaveStatus("saving");
      void saveDraftAsync({
        data: parsed.data,
        template: templateRef.current,
      }).then(
        () => {
          if (editVersion.current !== savingVersion) return;
          setSaveStatus("saved");
          setHasUnsavedChanges(false);
        },
        () => {
          setSaveStatus("error");
        },
      );
    }, 850);
  }, [form, saveDraftAsync]);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (isInitializing.current) return;
      editVersion.current += 1;
      setHasUnsavedChanges(true);
      setSaveStatus("unsaved");
      scheduleAutosave();
    });
    return () => {
      subscription.unsubscribe();
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [form, scheduleAutosave]);

  useEffect(() => {
    const preventLeaving = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", preventLeaving);
    return () => window.removeEventListener("beforeunload", preventLeaving);
  }, [hasUnsavedChanges]);

  const currentData = form.watch();
  const document = { template, data: currentData };
  const fullName = currentData.personal.fullName;
  const hasValidationErrors = !cvDataSchema.safeParse(currentData).success;

  useEffect(() => {
    const previousTitle = window.document.title;
    window.document.title = `${fullName || "CV"} — DevFolio`;
    return () => {
      window.document.title = previousTitle;
    };
  }, [fullName]);

  if (query.isPending) {
    return <div className="full-page-state">Opening your CV editor…</div>;
  }
  if (query.isError) {
    return (
      <div className="full-page-state full-page-error" role="alert">
        <h1>We couldn’t open this CV.</h1>
        <p>{query.error.message}</p>
        <Link className="button" to="/dashboard">
          Back to your CVs
        </Link>
      </div>
    );
  }

  async function saveNow(data: CvData): Promise<boolean> {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const savingVersion = editVersion.current;
    setSaveStatus("saving");
    try {
      await saveDraftAsync({ data, template: templateRef.current });
      if (editVersion.current !== savingVersion) {
        setSaveStatus("unsaved");
        return false;
      }
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      return true;
    } catch {
      setSaveStatus("error");
      return false;
    }
  }

  function changeTemplate(value: CvTemplate) {
    if (template === value) return;
    editVersion.current += 1;
    templateRef.current = value;
    setTemplate(value);
    setHasUnsavedChanges(true);
    setSaveStatus("unsaved");
    scheduleAutosave();
  }

  return (
    <div className="editor-workspace">
      <header className="editor-toolbar">
        <Link className="editor-back-link" to="/dashboard">
          <ArrowLeft size={17} aria-hidden="true" />
          <span className="brand-mark">D</span>
          <span className="editor-back-label">All CVs</span>
        </Link>
        <div
          className={`save-status save-status-${saveStatus}`}
          role="status"
          aria-live="polite"
        >
          {saveStatus === "saved" ? (
            <Check size={14} aria-hidden="true" />
          ) : saveStatus === "error" || saveStatus === "invalid" ? null : (
            <span className="save-status-dot" />
          )}
          {saveStatusText(saveStatus)}
        </div>
        <div className="editor-toolbar-actions">
          <Link className="button button-secondary button-small" to={`/portfolio/${id}`}>
            <Eye size={15} aria-hidden="true" />
            <span>Portfolio</span>
          </Link>
          <button
            className="button button-secondary button-small"
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={15} aria-hidden="true" />
            <span>Export PDF</span>
          </button>
          <button
            className="button button-small"
            type="submit"
            form="cv-editor-form"
            disabled={saveStatus === "saving"}
          >
            Save CV
          </button>
        </div>
      </header>

      <div className="editor-layout">
        <main className="editor-panel">
          <div className="editor-intro">
            <p className="eyebrow">YOUR STORY, WELL TOLD</p>
            <h1>Build your CV</h1>
            <p>Start with the details that matter. Your preview updates as you write.</p>
          </div>

          <div className="template-picker">
            <label htmlFor="cv-template">Template</label>
            <select
              id="cv-template"
              value={template}
              onChange={(event) => changeTemplate(event.target.value as CvTemplate)}
            >
              {Object.entries(templateNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <FormProvider {...form}>
            <form
              id="cv-editor-form"
              className="editor-form"
              onSubmit={form.handleSubmit(saveNow, () => {
                setSaveStatus("invalid");
              })}
            >
              <PersonalFields />
              <ExperienceFields />
              <EducationFields />
              <SkillsFields />
              <ProjectFields />
              <CertificationFields />
              <AdditionalFields />

              {saveStatus === "invalid" && (
                <div className="validation-notice" role="alert">
                  Add your full name and correct any fields marked in red before saving.
                </div>
              )}
              {saveStatus === "error" && (
                <div className="validation-notice" role="alert">
                  Your changes could not be saved to this browser. Check available storage
                  and try again.
                </div>
              )}

              <div className="editor-bottom-actions">
                <Link className="text-link" to="/dashboard">
                  <ArrowLeft size={15} aria-hidden="true" /> Back to your CVs
                </Link>
                <button
                  className="button"
                  type="submit"
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saved" ? "Saved" : "Save changes"}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
              {hasValidationErrors && (
                <p className="validation-footnote">
                  Draft autosave needs a full name and valid contact links.
                </p>
              )}
            </form>
          </FormProvider>
        </main>

        <aside className="preview-panel" aria-label="Live CV preview">
          <div className="preview-panel-heading">
            <div>
              <p className="eyebrow">LIVE PREVIEW</p>
              <span>{templateNames[template]}</span>
            </div>
            <button
              className="icon-button preview-print-button"
              type="button"
              onClick={() => window.print()}
              aria-label="Print or save as PDF"
              title="Print or save as PDF"
            >
              <Printer size={16} aria-hidden="true" />
            </button>
          </div>
          <CvPreview document={document} />
        </aside>
      </div>

      {blocker.state === "blocked" && (
        <div className="dialog-backdrop" role="presentation">
          <section
            className="leave-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-title"
            aria-describedby="leave-description"
          >
            <div className="leave-dialog-icon">!</div>
            <h2 id="leave-title">You have unsaved changes</h2>
            <p id="leave-description">Save your latest edits before leaving this CV.</p>
            <div className="leave-dialog-actions">
              <button
                className="button button-secondary"
                type="button"
                onClick={() => blocker.reset?.()}
              >
                Keep editing
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => blocker.proceed?.()}
              >
                Leave without saving
              </button>
              <button
                className="button"
                type="button"
                onClick={() => {
                  const parsed = cvDataSchema.safeParse(form.getValues());
                  if (!parsed.success) {
                    setSaveStatus("invalid");
                    return;
                  }
                  void saveNow(parsed.data).then((saved) => {
                    if (saved) blocker.proceed?.();
                  });
                }}
              >
                Save &amp; leave
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export function EditorPage() {
  const { id } = useParams();
  if (!id) {
    return (
      <div className="full-page-state" role="alert">
        CV identifier is missing.
      </div>
    );
  }
  return <EditorForm id={id} />;
}
