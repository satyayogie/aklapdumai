import { DestinasiCombobox } from "./destinasi";
import { listDestinasi, upsertDestinasi, deleteDestinasiAction } from "@/server/perdin/utils/destinasi";

type Props = {
  values: string[];
  onChange: (ids: string[]) => void;
};

export function DestinasiComboboxWrapper({ values, onChange }: Props) {
  return (
    <DestinasiCombobox
      values={values}
      onChange={onChange}
      listDestinasi={listDestinasi}
      upsertDestinasi={upsertDestinasi}
      deleteDestinasi={deleteDestinasiAction}
    />
  );
}
