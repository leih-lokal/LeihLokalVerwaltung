<script>
  import { flip } from "svelte/animate";
  import Note from "./Note.svelte";
  import AddNote from "./AddNote.svelte";
  import { getApiClient } from "../../../utils/api";
  import { onDestroy, onMount } from "svelte";
  import Logger from "js-logger";
  import { notifier } from "@beyonk/svelte-notifications";

  const colors = [
    "#ffd8c0",
    "#a1f5cf",
    "#f1bff4",
    "#d9bafd",
    "#a4e2fb",
    "#fdb7b8",
  ];
  const flipDurationMs = 300;

  const apiClient = getApiClient();

  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

  let notes = [];

  async function load() {
    try {
      notes = (await apiClient.getNotes()).items;
    } catch (e) {
      Logger.error(`Failed to load notes`, e);
      notifier.danger("Notizen konnten nicht geladen werden!", {
        persist: true,
      });
    }
  }

  onMount(() => {
    load();
  });

  onDestroy(() => {});

  const initializeNote = () => ({
    content: "",
    background_color: randomColor(),
    order_index: Math.min(notes.map((note) => note.order_index)) - 1,
  });

  const onAddNodeButtonClicked = () => {
    const newNote = initializeNote();
    notes = [newNote, ...notes];
    apiClient
      .createNote(newNote)
      .then(load)
      .catch((error) => {
        Logger.error(`Failed to create note ${newNote.id}`, error);
        notifier.danger("Notiz konnte nicht gespeichert werden!", {
          persist: true,
        });
      });
  };

  const onNoteDeleted = (id) => {
    apiClient
      .deleteNote(id)
      .then(() => (notes = notes.filter((note) => note.id !== id)))
      .catch((error) => {
        Logger.error(`Failed to remove note ${id}`, error);
        notifier.danger("Notiz konnte nicht gelöscht werden!", {
          persist: true,
        });
      });
  };

  const onNoteChanged = (id, updatedNote) => {
    const note = notes.find((note) => note.id === id);
    Object.assign(note, updatedNote); // must be inplace
    apiClient
      .updateNote(note.id, note)
      .then(() => (notes = [...notes]))
      .catch((error) => {
        Logger.error(`Failed to save note ${id}`, error);
        notifier.danger("Notiz konnte nicht gespeichert werden!", {
          persist: true,
        });
      });
  };

  const onNoteDrop = (event, dragEndIndex) => {
    event.dataTransfer.dropEffect = "move";
    const dragStartIndex = parseInt(event.dataTransfer.getData("text/plain"));
    if (dragStartIndex !== dragEndIndex) {
      const draggedNote = notes[dragStartIndex];
      notes[dragStartIndex] = notes[dragEndIndex];
      notes[dragEndIndex] = draggedNote;
      notes.forEach((note, i) => (note.order_index = i));
      // TODO: improve, reduce db updates
      Promise.all(notes.map((note) => onNoteChanged(note.id, note)))
        .then(() => (notes = [...notes]))
        .catch(() => {});
    }
  };

  const onNoteDragStart = (event, i) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.dropEffect = "move";
    const startIndex = i;
    event.dataTransfer.setData("text/plain", startIndex);
  };
</script>

<div class="notescontainer">
  <div class="notescontainerheader">Notizen</div>
  <div class="notescontainercontent">
    {#each notes as note, index (note.id)}
      <div animate:flip={{ duration: flipDurationMs }}>
        <Note
          id={note.id}
          content={note.content}
          timestamp={new Date(note.updated).getTime()}
          backgroundColor={note.background_color}
          on:delete={(e) => onNoteDeleted(note.id)}
          on:change={(e) =>
            onNoteChanged(note.id, { ...note, content: e.detail })}
          on:dragstart={(event) => onNoteDragStart(event, index)}
          on:drop={(event) => onNoteDrop(event, index)}
        />
      </div>
    {/each}
    <AddNote on:click={onAddNodeButtonClicked} />
  </div>
</div>

<style>
  .notescontainer {
    display: flex;
    flex-direction: column;
    background-color: white;
    --note-width: 24rem;
  }

  .notescontainerheader {
    font-size: 1.7rem;
    padding: 1rem 1rem 0 1rem;
    font-weight: bold;
  }

  .notescontainercontent {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
</style>
