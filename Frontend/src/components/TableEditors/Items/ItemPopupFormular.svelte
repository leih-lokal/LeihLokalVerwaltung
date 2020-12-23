<script>
    import PopupFormularConfiguration from "../../Input/PopupFormularConfiguration";
    import InputTypes from "../../Input/InputTypes";
    import PopupFormular from "../../Input/PopupFormular.svelte";
    import { itemDb } from "../../../utils/stores";
    import { notifier } from "@beyonk/svelte-notifications";
    import WoocommerceClient from "ENV_WC_CLIENT";

    const woocommerceClient = new WoocommerceClient();

    export let createNew;
    export let doc = {};

    const popupFormularConfiguration = new PopupFormularConfiguration()
        .setDocName("Gegenstand")
        .setCreateInitialDoc(async (doc) => {
            doc._id = String(await $itemDb.nextUnusedId());
            doc.added = new Date().getTime();
        })
        .setOnDeleteButtonClicked((doc, close) => {
            if (confirm("Soll dieser Gegenstand wirklich gelöscht werden?")) {
                $itemDb
                    .removeDoc(doc)
                    .then(() => notifier.success("Gegenstand gelöscht!"))
                    .then(close)
                    .catch((error) => {
                        console.error(error);
                        notifier.danger(
                            "Gegenstand konnte nicht gelöscht werden!",
                            6000
                        );
                    });
            }
        })
        .setOnSaveButtonClicked(async (doc, createNew, close) => {
            const savePromise = createNew
                ? $itemDb.createDoc(doc)
                : $itemDb.updateDoc(doc);
            await savePromise
                .then((result) => notifier.success("Gegenstand gespeichert!"))
                .then(close)
                .catch((error) => {
                    notifier.danger(
                        "Gegenstand konnte nicht gespeichert werden!",
                        6000
                    );
                    console.error(error);
                });

            if (createNew) {
                woocommerceClient
                    .createItem(doc)
                    .then((wcDoc) => {
                        doc.wc_url = wcDoc.permalink;
                        doc.wc_id = wcDoc.id;
                        console.log(doc);
                        $itemDb.updateDoc(doc);
                        notifier.success(
                            "Gegenstand auf der Webseite erstellt!",
                            3000
                        );
                    })
                    .catch((error) => {
                        notifier.warning(
                            "Gegenstand konnte auf der Webseite nicht erstellt werden!",
                            6000
                        );
                        console.error(error);
                    });
            } else {
                woocommerceClient
                    .updateItem(doc)
                    .then(() =>
                        notifier.success(
                            "Status auf der Webseite aktualisiert!",
                            3000
                        )
                    )
                    .catch((error) => {
                        notifier.warning(
                            "Status auf der Webseite konnte nicht aktualisiert werden!",
                            6000
                        );
                        console.error(error);
                    });
            }
        })
        .setInputGroups([
            "Bezeichnung",
            "Eigenschaften",
            "Zubehör",
            "Bild",
            "Status",
        ])
        .setInputs([
            {
                id: "item_id",
                label: "Gegenstand Nr",
                group: "Bezeichnung",
                type: InputTypes.TEXT,
                bindToDocAttribute: "_id",
            },
            {
                id: "item_name",
                label: "Gegenstand Name",
                group: "Bezeichnung",
                type: InputTypes.TEXT,
                bindToDocAttribute: "item_name",
            },
            {
                id: "brand",
                label: "Marke",
                group: "Bezeichnung",
                type: InputTypes.TEXT,
                bindToDocAttribute: "brand",
            },
            {
                id: "itype",
                label: "Typbezeichnung",
                group: "Bezeichnung",
                type: InputTypes.TEXT,
                bindToDocAttribute: "itype",
            },

            {
                id: "category",
                label: "Kategorie",
                group: "Eigenschaften",
                type: InputTypes.SELECTION,
                bindToDocAttribute: "category",
                selectionOptions: [
                    "Küche",
                    "Haushalt",
                    "Garten",
                    "Kinder",
                    "Freizeit",
                    "Heimwerker",
                ],
                isCreatable: false,
                isMulti: true,
                isClearable: true,
            },
            {
                id: "deposit",
                label: "Pfand",
                group: "Eigenschaften",
                type: InputTypes.TEXT,
                bindToDocAttribute: "deposit",
            },
            {
                id: "added",
                label: "Erfasst am",
                group: "Eigenschaften",
                type: InputTypes.DATE,
                bindToDocAttribute: "added",
            },
            {
                id: "properties",
                label: "Eigenschaften",
                group: "Eigenschaften",
                type: InputTypes.TEXT,
                bindToDocAttribute: "properties",
            },

            {
                id: "parts",
                label: "Anzahl Teile",
                group: "Zubehör",
                type: InputTypes.TEXT,
                bindToDocAttribute: "parts",
            },
            {
                id: "manual",
                label: "Anleitung",
                group: "Zubehör",
                type: InputTypes.TEXT,
                bindToDocAttribute: "manual",
            },
            {
                id: "package",
                label: "Verpackung",
                group: "Zubehör",
                type: InputTypes.TEXT,
                bindToDocAttribute: "package",
            },

            {
                id: "image",
                label: "Bild",
                group: "Bild",
                type: InputTypes.TEXT,
                bindToDocAttribute: "image",
            },

            {
                id: "status_on_website",
                label: "Status auf Webseite",
                group: "Status",
                type: InputTypes.SELECTION,
                bindToDocAttribute: "status_on_website",
                selectionOptions: [
                    { value: "deleted", label: "gelöscht" },
                    { value: "instock", label: "verfügbar" },
                    { value: "outofstock", label: "verliehen" },
                ],
                isCreatable: false,
                isMulti: false,
                isClearable: false,
            },
        ]);
</script>

<PopupFormular {popupFormularConfiguration} {createNew} {doc} />
