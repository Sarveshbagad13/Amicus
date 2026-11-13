"""
BillSum Legal Language Warm-Up Pretraining Script for Amicus
Adapts facebook/bart-base on the BillSum dataset to learn formal legal discourse,
statutory sentence structures, and long-range legal dependencies prior to contract fine-tuning.
"""

import argparse
import logging
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    DataCollatorForSeq2Seq,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments
)
import evaluate
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def preprocess_function(examples, tokenizer, max_input_length=1024, max_target_length=256):
    inputs = ["summarize legal document: " + doc for doc in examples["text"]]
    model_inputs = tokenizer(inputs, max_length=max_input_length, truncation=True, padding="max_length")

    labels = tokenizer(text_target=examples["summary"], max_length=max_target_length, truncation=True, padding="max_length")
    # Replace padding token id's of the label by -100 so it's ignored by the loss
    labels["input_ids"] = [
        [(l if l != tokenizer.pad_token_id else -100) for l in label] for label in labels["input_ids"]
    ]

    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

def compute_metrics(eval_pred, tokenizer, rouge_metric):
    predictions, labels = eval_pred
    decoded_preds = tokenizer.batch_decode(predictions, skip_special_tokens=True)
    
    # Replace -100 in the labels as we can't decode them
    labels = np.where(labels != -100, labels, tokenizer.pad_token_id)
    decoded_labels = tokenizer.batch_decode(labels, skip_special_tokens=True)

    result = rouge_metric.compute(predictions=decoded_preds, references=decoded_labels, use_stemmer=True)
    prediction_lens = [np.count_nonzero(pred != tokenizer.pad_token_id) for pred in predictions]
    result["gen_len"] = np.mean(prediction_lens)

    return {k: round(v * 100, 4) for k, v in result.items()}

def main():
    parser = argparse.ArgumentParser(description="BillSum Pre-training Warm-up for BART")
    parser.add_argument("--model_name", type=str, default="facebook/bart-base", help="Base model identifier")
    parser.add_argument("--output_dir", type=str, default="./models/bart-billsum-warmup", help="Output directory")
    parser.add_argument("--num_train_epochs", type=int, default=3, help="Training epochs")
    parser.add_argument("--batch_size", type=int, default=4, help="Batch size per device")
    parser.add_argument("--learning_rate", type=float, default=5e-5, help="Learning rate")
    args = parser.parse_args()

    logger.info(f"Loading BillSum dataset...")
    raw_datasets = load_dataset("billsum")

    logger.info(f"Loading tokenizer and model for {args.model_name}...")
    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    assert tokenizer is not None, "Tokenizer failed to load"
    model = AutoModelForSeq2SeqLM.from_pretrained(args.model_name)

    logger.info("Tokenizing dataset...")
    tokenized_datasets = raw_datasets.map(
        lambda x: preprocess_function(x, tokenizer),
        batched=True,
        remove_columns=raw_datasets["train"].column_names
    )

    rouge_metric = evaluate.load("rouge")

    training_args = Seq2SeqTrainingArguments(
        output_dir=args.output_dir,
        eval_strategy="epoch",
        learning_rate=args.learning_rate,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        weight_decay=0.01,
        save_total_limit=2,
        num_train_epochs=args.num_train_epochs,
        predict_with_generate=True,
        fp16=False,  # CPU / standard GPU compatibility
        logging_steps=50,
        report_to="none"
    )

    data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_datasets["train"],
        eval_dataset=tokenized_datasets["test"],  # type: ignore[arg-type]
        processing_class=tokenizer,
        data_collator=data_collator,
        compute_metrics=lambda p: compute_metrics(p, tokenizer, rouge_metric)
    )

    logger.info("Starting BillSum training warm-up...")
    trainer.train()

    logger.info(f"Saving model to {args.output_dir}...")
    trainer.save_model(args.output_dir)
    if tokenizer is not None:
        tokenizer.save_pretrained(args.output_dir)
    logger.info("BillSum legal warm-up training completed successfully.")

if __name__ == "__main__":
    main()
