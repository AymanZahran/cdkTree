import yaml
import json

Inputs = [
  "./cdkTreeTestInput/01_sqs_sns.json",
  "./cdkTreeTestInput/02_hello_lambda.json",
  "./cdkTreeTestInput/03_lambda_apigw.json",
  "./cdkTreeTestInput/04_serverless.json",
  "./cdkTreeTestInput/05_cdk_pipelines.json",
  "./cdkTreeTestInput/06_fargate.json",
  "./cdkTreeTestInput/07_serverless_fargate_pipeline.json",
]

Outputs = [
  "cdkTreeTestInputFormated/01_sqs_sns.txt",
  "cdkTreeTestInputFormated/02_hello_lambda.txt",
  "cdkTreeTestInputFormated/03_lambda_apigw.txt",
  "cdkTreeTestInputFormated/04_serverless.txt",
  "cdkTreeTestInputFormated/05_cdk_pipelines.txt",
  "cdkTreeTestInputFormated/06_fargate.txt",
  "cdkTreeTestInputFormated/07_serverless_fargate_pipeline.txt",
]

def GetTree(Tree, indentation, file):
  file.write(' ' * indentation + "id   :  " + Tree["id"] + "\n")
  file.write(' ' * indentation + "path :  " + Tree["path"] + "\n")
  file.write(' ' * indentation + "lib  :  " + Tree["constructInfo"]["fqn"] + "\n")
  if "attributes" in Tree:
    file.write(' ' * indentation + "attributes  :  " + "\n")
    for line in yaml.dump(Tree["attributes"]).splitlines():
      file.write(' ' * (indentation + 4) + line + "\n")
  if "children" in Tree:
    for Child in Tree["children"]:
      GetTree(Tree["children"][Child], indentation + 4, file)

for FileCount in range(len(Inputs)):
  file = open(Inputs[FileCount])
  data = json.load(file)
  Tree = data["tree"]
  file.close()
  with open(Outputs[FileCount], "w") as file:
    GetTree(Tree, 0, file)
  file.close()
